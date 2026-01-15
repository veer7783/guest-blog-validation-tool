import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CSVParserService } from '../services/csvParser.service';
import { DuplicateCheckService } from '../services/duplicateCheck.service';
import { UploadTaskService } from '../services/uploadTask.service';
import { DataInProcessService } from '../services/dataInProcess.service';
import { cleanupFile } from '../middleware/upload';
import { ActivityLogService } from '../services/activityLog.service';
import { getClientIp } from '../utils/helpers';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';
import { compareAndGetUpdates, shouldUpdateBasedOnPrice, hasFieldUpdates } from '../utils/fieldComparison';
import prisma from '../config/database';

export class UploadController {
  /**
   * Upload and process CSV file
   */
  static async uploadCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const filePath = req.file?.path;

    try {
      if (!req.file || !filePath) {
        res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' }
        });
        return;
      }

      const userId = req.user!.id;
      const userRole = req.user!.role;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      // Get assignedTo - for CONTRIBUTOR, use their assigned admin; for others, require manual assignment
      let assignedTo = req.body.assignedTo;
      
      if (userRole === 'CONTRIBUTOR') {
        // Get CONTRIBUTOR's assigned admin
        const contributor = await prisma.user.findUnique({
          where: { id: userId },
          select: { assignedAdminId: true }
        });
        
        if (!contributor?.assignedAdminId) {
          cleanupFile(filePath);
          res.status(400).json({
            success: false,
            error: { message: 'No admin assigned to your account. Please contact administrator.' }
          });
          return;
        }
        
        assignedTo = contributor.assignedAdminId;
      } else {
        // For SUPER_ADMIN and ADMIN, validate that assignedTo is provided
        if (!assignedTo) {
          cleanupFile(filePath);
          res.status(400).json({
            success: false,
            error: { message: 'User assignment is required before uploading' }
          });
          return;
        }
      }

      // Parse CSV
      const parsedData = await CSVParserService.parseCSV(filePath);

      if (parsedData.validCount === 0) {
        cleanupFile(filePath);
        res.status(400).json({
          success: false,
          error: { message: 'No valid records found in CSV' },
          data: {
            totalRows: parsedData.totalRows,
            invalidRows: parsedData.invalidRows
          }
        });
        return;
      }

      // First, remove duplicates within the CSV file itself
      const seenUrls = new Set<string>();
      const uniqueRowsInCSV: typeof parsedData.validRows = [];
      const duplicatesInCSV: string[] = [];
      
      for (const row of parsedData.validRows) {
        const normalizedUrl = row.websiteUrl.toLowerCase();
        if (seenUrls.has(normalizedUrl)) {
          duplicatesInCSV.push(row.websiteUrl);
        } else {
          seenUrls.add(normalizedUrl);
          uniqueRowsInCSV.push(row);
        }
      }

      // Check if CSV has price data
      const hasPriceData = uniqueRowsInCSV.some(row => row.price && parseFloat(row.price) > 0);
      
      // Now check unique URLs against database and main project
      const websiteUrls = uniqueRowsInCSV.map(row => row.websiteUrl);
      let duplicateCheck;
      let priceCheckResults: any = null;
      let priceSkippedDomains: Array<{ domain: string; reason: string; currentPrice?: number; newPrice?: number }> = [];
      let priceUpdatedDomains: Array<{ domain: string; currentPrice: number; newPrice: number }> = [];
      
      try {
        duplicateCheck = await DuplicateCheckService.checkBulk(websiteUrls);
        
        // If CSV has price data, check prices against main project for duplicates
        if (hasPriceData) {
          const sitesWithPrices = uniqueRowsInCSV
            .filter(row => row.price && parseFloat(row.price) > 0)
            .map(row => ({
              site_url: row.websiteUrl,
              new_price: parseFloat(row.price!)
            }));
          
          if (sitesWithPrices.length > 0) {
            // Check prices against ALL modules in main tool (guest blog sites + pending sites)
            priceCheckResults = await MainProjectAPIService.checkPricesAllModules(sitesWithPrices);
          }
        }
      } catch (error: any) {
        // If Main Project API fails, return specific error
        if (error.message && error.message.includes('Main Project API')) {
          cleanupFile(filePath);
          res.status(503).json({
            success: false,
            error: { 
              message: 'Connection issue with Link Management App.',
              details: 'Unable to verify duplicates against the main project. Please try again later or contact support.'
            }
          });
          return;
        }
        throw error;
      }

      // Filter rows based on duplicate check and price comparison
      let uniqueRows: typeof uniqueRowsInCSV = [];
      // Track rows that need updates in current system (not new records)
      // Include all field updates from enhanced comparison logic
      const rowsToUpdateInCurrentSystem: Array<{ 
        id: string; 
        source: string;
        updates: any;
        hasPriceImprovement?: boolean;
      }> = [];
      
      if (hasPriceData && priceCheckResults?.success) {
        // Price-based filtering: allow duplicates if new price is lower
        for (let i = 0; i < uniqueRowsInCSV.length; i++) {
          const row = uniqueRowsInCSV[i];
          const dupCheck = duplicateCheck.duplicates[i];
          const rowPrice = row.price ? parseFloat(row.price) : 0;
          
          // Check price result for this site (from main project)
          const priceResult = priceCheckResults.results.find(
            (r: any) => r.site_url.toLowerCase() === row.websiteUrl.toLowerCase()
          );
          
          if (!dupCheck.isDuplicate) {
            // Not a duplicate - include it as new
            console.log(`[${row.websiteUrl}] Not a duplicate - adding as new`);
            uniqueRows.push(row);
          } else if (rowPrice > 0) {
            console.log(`[${row.websiteUrl}] Is duplicate with price ${rowPrice}, source: ${dupCheck.source}`);
            // It's a duplicate with price - check source and compare prices
            
            if ((dupCheck.source === 'main_project' || dupCheck.source === 'guest_blog_sites' || dupCheck.source === 'pending_sites_pending') && priceResult) {
              // Duplicate in main project (guest blog sites OR pending sites with pending status)
              if (priceResult.action === 'UPDATE') {
                // Price is lower - include for update (will be sent to main project)
                uniqueRows.push(row);
                priceUpdatedDomains.push({
                  domain: row.websiteUrl,
                  currentPrice: priceResult.current_price || 0,
                  newPrice: rowPrice
                });
              } else if (priceResult.action === 'SKIP_HIGHER' || priceResult.action === 'SKIP_SAME') {
                // Price is same or higher - skip
                const sourceLabel = dupCheck.source === 'pending_sites_pending' ? 'pending sites (pending status)' : 'main project';
                priceSkippedDomains.push({
                  domain: row.websiteUrl,
                  reason: `${priceResult.action === 'SKIP_SAME' ? 'Same price' : 'Higher price'} (in ${sourceLabel})`,
                  currentPrice: priceResult.current_price,
                  newPrice: rowPrice
                });
              } else if (priceResult.action === 'CREATE') {
                // Doesn't exist in main project - include it
                uniqueRows.push(row);
              }
            } else if (dupCheck.source === 'data_in_process' || dupCheck.source === 'data_final') {
              // Duplicate in current system - use enhanced field comparison
              const existingPrice = dupCheck.existingPrice || 0;
              const existingData = dupCheck.existingData;
              
              console.log(`\n=== CHECKING: ${row.websiteUrl} ===`);
              console.log(`CSV Price: ${rowPrice}, Existing Price in Current System: ${existingPrice}`);
              
              // IMPORTANT: Also check main project price even if site exists in current system
              // If main project has lower price, skip this upload
              if (priceResult && rowPrice > 0) {
                console.log(`Main Project Price Check: ${priceResult.current_price}`);
                if (priceResult.action === 'SKIP_HIGHER' || priceResult.action === 'SKIP_SAME') {
                  // Main project has same or lower price - skip this upload
                  console.log(`⚠️ SKIPPING: Main project has lower/same price (${priceResult.current_price}) than CSV (${rowPrice})`);
                  priceSkippedDomains.push({
                    domain: row.websiteUrl,
                    reason: `${priceResult.action === 'SKIP_SAME' ? 'Same price' : 'Higher price'} (in main project)`,
                    currentPrice: priceResult.current_price,
                    newPrice: rowPrice
                  });
                  continue; // Skip to next row
                }
                console.log(`✓ Main project price check passed - CSV price is lower or site not in main project`);
              }
              
              // Check if we should update based on price (existing logic)
              const shouldUpdatePrice = rowPrice > 0 && shouldUpdateBasedOnPrice(row, existingData, dupCheck.source as 'data_in_process' | 'data_final');
              console.log(`shouldUpdatePrice (vs current system): ${shouldUpdatePrice}`);
              
              // Check if we should update based on other field differences (new logic)
              const shouldUpdateFields = hasFieldUpdates(row, existingData, dupCheck.source as 'data_in_process' | 'data_final');
              console.log(`shouldUpdateFields: ${shouldUpdateFields}`);
              
              if (shouldUpdatePrice || shouldUpdateFields) {
                // Get all field updates (price + other fields)
                const fieldUpdates = compareAndGetUpdates(row, existingData, dupCheck.source as 'data_in_process' | 'data_final');
                
                console.log(`[FIELD UPDATE] Row: ${row.websiteUrl}, updates:`, fieldUpdates);
                console.log(`Will add to priceUpdatedDomains: ${shouldUpdatePrice}`);
                
                rowsToUpdateInCurrentSystem.push({
                  id: dupCheck.existingId!,
                  source: dupCheck.source,
                  updates: fieldUpdates,
                  hasPriceImprovement: shouldUpdatePrice // Track if this update has a lower price
                });
                
                // Track price updates for reporting (if price changed)
                if (shouldUpdatePrice) {
                  console.log(`✓ Adding to priceUpdatedDomains: ${row.websiteUrl}`);
                  priceUpdatedDomains.push({
                    domain: row.websiteUrl,
                    currentPrice: existingPrice,
                    newPrice: rowPrice
                  });
                } else {
                  console.log(`✗ NOT adding to priceUpdatedDomains (only field updates, no price change)`);
                }
              } else if (rowPrice > 0) {
                // Has price but no updates needed in current system
                // Note: Main project price already checked above, so this is current system only
                if (rowPrice === existingPrice) {
                  priceSkippedDomains.push({
                    domain: row.websiteUrl,
                    reason: 'Same price (in current system)',
                    currentPrice: existingPrice,
                    newPrice: rowPrice
                  });
                } else {
                  priceSkippedDomains.push({
                    domain: row.websiteUrl,
                    reason: 'Higher price (in current system)',
                    currentPrice: existingPrice,
                    newPrice: rowPrice
                  });
                }
              }
              // If no price and no field updates, track as skipped
              else {
                // Duplicate with no updates needed
                priceSkippedDomains.push({
                  domain: row.websiteUrl,
                  reason: rowPrice > 0 ? 'No updates needed (in current system)' : 'Duplicate without price (in current system)',
                  currentPrice: existingPrice,
                  newPrice: rowPrice
                });
              }
            }
          } else {
            // Duplicate without price - track as skipped
            console.log(`[${row.websiteUrl}] Is duplicate WITHOUT price, source: ${dupCheck.source} - tracking as skipped`);
            const sourceLabel = dupCheck.source === 'main_project' || dupCheck.source === 'guest_blog_sites' || dupCheck.source === 'pending_sites_pending' 
              ? 'in main project' 
              : dupCheck.source === 'data_in_process' 
              ? 'in current system (in process)' 
              : dupCheck.source === 'data_final' 
              ? 'in current system (final)' 
              : 'in system';
            priceSkippedDomains.push({
              domain: row.websiteUrl,
              reason: `Duplicate without price (${sourceLabel})`,
              currentPrice: 0,
              newPrice: 0
            });
          }
        }
      } else {
        // No price data - use original duplicate filtering
        uniqueRows = uniqueRowsInCSV.filter((row, index) => 
          !duplicateCheck.duplicates[index].isDuplicate
        );
      }

      // Check if there are any new domains OR price updates to process
      if (uniqueRows.length === 0 && rowsToUpdateInCurrentSystem.length === 0) {
        cleanupFile(filePath);
        
        // Get duplicate domains with their sources
        const duplicateDomainsWithSource = duplicateCheck.duplicates
          .filter(d => d.isDuplicate)
          .map(d => ({
            domain: d.websiteUrl,
            source: d.source === 'main_project' || d.source === 'guest_blog_sites' ? 'Links Management App' : 
                    d.source === 'pending_sites_pending' ? 'Links Management App (Pending Sites)' :
                    d.source === 'data_in_process' ? 'Current System (In Process)' :
                    d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
          }));

        const totalDuplicates = duplicateCheck.duplicateCount + duplicatesInCSV.length;
        
        // Count duplicates by source - EXCLUDE only price-updated domains
        // Price-skipped domains should be included in their source counts
        const priceUpdateUrls = new Set(priceUpdatedDomains.map(d => d.domain.toLowerCase()));
        
        // Main project duplicates: exclude only price updates (include price-skipped)
        const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => 
          d.source === 'Links Management App' && 
          !priceUpdateUrls.has(d.domain.toLowerCase())
        ).length;
        
        // Current system duplicates: exclude only price updates (include price-skipped)
        const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => 
          d.source.startsWith('Current System') && 
          !priceUpdateUrls.has(d.domain.toLowerCase())
        ).length;

        res.status(200).json({
          success: false,
          message: hasPriceData 
            ? 'No new domains to process. All domains are duplicates or have same/higher prices.'
            : 'No new domains to process. All domains are duplicates.',
          data: {
            summary: {
              totalRows: parsedData.totalRows,
              validRows: parsedData.validCount,
              invalidRows: parsedData.invalidCount,
              uniqueRows: 0,
              duplicateRows: totalDuplicates,
              duplicatesInCSV: duplicatesInCSV.length,
              duplicatesInSystem: duplicateCheck.duplicateCount,
              duplicatesInMainProject: duplicatesInMainProject,
              duplicatesInCurrentSystem: duplicatesInCurrentSystem,
              priceSkipped: priceSkippedDomains.length,
              priceUpdates: priceUpdatedDomains.length
            },
            duplicateDomains: duplicateDomainsWithSource.map(d => d.domain),
            duplicateDetails: duplicateDomainsWithSource,
            csvDuplicates: duplicatesInCSV,
            priceSkippedDomains: priceSkippedDomains,
            priceUpdatedDomains: priceUpdatedDomains
          }
        });
        return;
      }

      // Handle case where we only have field updates (no new domains)
      if (uniqueRows.length === 0 && rowsToUpdateInCurrentSystem.length > 0) {
        // Update existing records using enhanced field update logic
        for (const update of rowsToUpdateInCurrentSystem) {
          console.log(`[ENHANCED UPDATE - ONLY UPDATES] Updating ${update.source} record ${update.id} with:`, JSON.stringify(update.updates));
          
          if (update.source === 'data_in_process') {
            await prisma.dataInProcess.update({
              where: { id: update.id },
              data: update.updates
            });
          } else if (update.source === 'data_final') {
            // If contact info is being updated, reset publisherMatched so user can re-mark as publisher
            if (update.updates.contactEmail || update.updates.contactName) {
              update.updates.publisherMatched = false;
            }
            
            await prisma.dataFinal.update({
              where: { id: update.id },
              data: update.updates
            });
          }
          
          console.log(`[ENHANCED UPDATE - ONLY UPDATES] Successfully updated ${update.source} record ${update.id}`);
        }

        cleanupFile(filePath);

        // Get duplicate domains with their sources
        const duplicateDomainsWithSource = duplicateCheck.duplicates
          .filter(d => d.isDuplicate)
          .map(d => ({
            domain: d.websiteUrl,
            source: d.source === 'main_project' || d.source === 'guest_blog_sites' ? 'Links Management App' : 
                    d.source === 'pending_sites_pending' ? 'Links Management App (Pending Sites)' :
                    d.source === 'data_in_process' ? 'Current System (In Process)' :
                    d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
          }));

        const totalDuplicates = duplicateCheck.duplicateCount + duplicatesInCSV.length;
        const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => d.source === 'Links Management App').length;
        // Exclude only price updates from current system duplicates count
        const priceUpdateUrls = new Set(priceUpdatedDomains.map(d => d.domain.toLowerCase()));
        const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => 
          d.source.startsWith('Current System') && 
          !priceUpdateUrls.has(d.domain.toLowerCase())
        ).length;

        res.status(200).json({
          success: true,
          message: `Updated ${priceUpdatedDomains.length > 0 ? 'prices for' : ''} ${rowsToUpdateInCurrentSystem.length} existing record(s).`,
          data: {
            summary: {
              totalRows: parsedData.totalRows,
              validRows: parsedData.validCount,
              invalidRows: parsedData.invalidCount,
              uniqueRows: 0,
              duplicateRows: totalDuplicates,
              duplicatesInCSV: duplicatesInCSV.length,
              duplicatesInSystem: duplicateCheck.duplicateCount,
              duplicatesInMainProject: duplicatesInMainProject,
              duplicatesInCurrentSystem: duplicatesInCurrentSystem,
              priceSkipped: priceSkippedDomains.length,
              priceUpdates: priceUpdatedDomains.length
            },
            priceUpdatedDomains: priceUpdatedDomains,
            priceSkippedDomains: priceSkippedDomains
          }
        });
        return;
      }

      // Create upload task only if there are new domains
      const uploadTask = await UploadTaskService.create({
        fileName: req.file.originalname,
        totalRecords: parsedData.totalRows,
        validRecords: parsedData.validCount,
        invalidRecords: parsedData.invalidCount,
        assignedTo: req.body.assignedTo || userId
      }, userId);

      // Create data in process records (only for truly new domains)
      if (uniqueRows.length > 0) {
        // Check publishers against main tool for rows that have publisher info
        const rowsWithPublisher = uniqueRows.filter(row => row.publisher);
        let publisherMatchResults: Map<string, { matched: boolean; publisherId?: string; publisherName?: string; publisherEmail?: string }> = new Map();
        let localPendingPublisherByEmail: Map<string, { publisherId: string; publisherName?: string | null; publisherEmail?: string | null }> = new Map();
        
        if (rowsWithPublisher.length > 0) {
          try {
            // Fetch all publishers from main tool
            const publishersResult = await MainProjectAPIService.fetchPublishers();
            
            if (publishersResult.success && publishersResult.publishers.length > 0) {
              // Check each row's publisher against the main tool publishers
              for (const row of rowsWithPublisher) {
                const publisherValue = row.publisher!.toLowerCase().trim();
                
                // Try to match by email or name
                const matchedPublisher = publishersResult.publishers.find(p => 
                  p.email?.toLowerCase() === publisherValue ||
                  p.publisherName?.toLowerCase() === publisherValue ||
                  p.publisherName?.toLowerCase().includes(publisherValue) ||
                  publisherValue.includes(p.publisherName?.toLowerCase() || '')
                );
                
                if (matchedPublisher) {
                  publisherMatchResults.set(row.websiteUrl, {
                    matched: true,
                    publisherId: matchedPublisher.id,
                    publisherName: matchedPublisher.publisherName,
                    publisherEmail: matchedPublisher.email || undefined
                  });
                } else {
                  // Not matched - store as contact info
                  const isEmail = row.publisher!.includes('@');
                  publisherMatchResults.set(row.websiteUrl, {
                    matched: false,
                    publisherId: undefined,
                    publisherName: isEmail ? undefined : row.publisher,
                    publisherEmail: isEmail ? row.publisher : undefined
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error checking publishers:', error);
            // Continue without publisher matching if it fails
          }
        }

        // Local pending publisher match: if publisher email isn't found in LM Tool,
        // but it already exists locally as a pending publisher (pending_...), reuse it.
        // This helps new records show "Publisher will be created in the LM Tool" consistently.
        const unmatchedPublisherEmails = rowsWithPublisher
          .map(r => r.publisher)
          .filter((p): p is string => typeof p === 'string' && p.includes('@'))
          .map(p => p.toLowerCase().trim());

        if (unmatchedPublisherEmails.length > 0) {
          const pendingInProcess = await prisma.dataInProcess.findMany({
            where: {
              publisherId: { startsWith: 'pending_' },
              publisherEmail: { in: unmatchedPublisherEmails }
            },
            select: {
              publisherId: true,
              publisherName: true,
              publisherEmail: true
            }
          });

          const pendingInFinal = await prisma.dataFinal.findMany({
            where: {
              publisherId: { startsWith: 'pending_' },
              publisherEmail: { in: unmatchedPublisherEmails }
            },
            select: {
              publisherId: true,
              publisherName: true,
              publisherEmail: true
            }
          });

          for (const p of [...pendingInProcess, ...pendingInFinal]) {
            const emailKey = (p.publisherEmail || '').toLowerCase().trim();
            if (!emailKey) continue;
            if (!localPendingPublisherByEmail.has(emailKey)) {
              localPendingPublisherByEmail.set(emailKey, {
                publisherId: p.publisherId!,
                publisherName: p.publisherName,
                publisherEmail: p.publisherEmail
              });
            }
          }
        }
        
        console.log('[UPLOAD] Creating DataInProcess records. User ID:', req.user?.id, 'User Role:', req.user?.role);
        console.log('[UPLOAD] Number of unique rows to insert:', uniqueRows.length);
        
        const recordsToCreate = uniqueRows.map(row => {
          const publisherMatch = publisherMatchResults.get(row.websiteUrl);
          const publisherEmailKey = publisherMatch?.publisherEmail?.toLowerCase().trim();
          const localPending = publisherEmailKey ? localPendingPublisherByEmail.get(publisherEmailKey) : undefined;
          const useLocalPending = Boolean(localPending) && publisherMatch && !publisherMatch.matched && publisherMatch.publisherEmail;

          const finalPublisherId = useLocalPending ? localPending!.publisherId : publisherMatch?.publisherId;
          const finalPublisherMatched = useLocalPending ? true : (publisherMatch?.matched || false);
          const finalPublisherName = useLocalPending ? (localPending!.publisherName || publisherMatch?.publisherName) : publisherMatch?.publisherName;
          const finalPublisherEmail = useLocalPending ? (localPending!.publisherEmail || publisherMatch?.publisherEmail) : publisherMatch?.publisherEmail;

          return {
            ...row,
            price: row.price ? parseFloat(row.price) : undefined,
            liBasePrice: row.liBasePrice ? parseFloat(row.liBasePrice) : undefined,
            uploadTaskId: uploadTask.id,
            publisherId: finalPublisherId,
            publisherMatched: finalPublisherMatched,
            publisherName: finalPublisherName,
            publisherEmail: finalPublisherEmail,
            contactName: !finalPublisherMatched && row.publisher && !row.publisher.includes('@') ? row.publisher : undefined,
            contactEmail: !finalPublisherMatched && row.publisher && row.publisher.includes('@') ? row.publisher : undefined,
            uploadedBy: req.user?.id
          };
        });
        
        console.log('[UPLOAD] Sample record to create:', JSON.stringify(recordsToCreate[0]));
        
        await DataInProcessService.bulkCreate(recordsToCreate);
        
        console.log('[UPLOAD] Successfully created', recordsToCreate.length, 'records in DataInProcess');
      }

      // Update existing records in current system with enhanced field updates
      if (rowsToUpdateInCurrentSystem.length > 0) {
        const userRole = req.user?.role;
        
        for (const update of rowsToUpdateInCurrentSystem) {
          // Only set uploadedBy if:
          // 1. User is SUPER_ADMIN (can update anything), OR
          // 2. User is CONTRIBUTOR AND they provided a lower price (hasPriceImprovement)
          if (userRole === 'SUPER_ADMIN' || (userRole === 'CONTRIBUTOR' && update.hasPriceImprovement)) {
            update.updates.uploadedBy = req.user?.id;
            console.log(`[ENHANCED UPDATE] Setting uploadedBy for ${userRole} (hasPriceImprovement: ${update.hasPriceImprovement})`);
          } else {
            console.log(`[ENHANCED UPDATE] NOT setting uploadedBy for ${userRole} (hasPriceImprovement: ${update.hasPriceImprovement})`);
          }
          
          console.log(`[ENHANCED UPDATE] Updating ${update.source} record ${update.id} with:`, JSON.stringify(update.updates));
          
          if (update.source === 'data_in_process') {
            await prisma.dataInProcess.update({
              where: { id: update.id },
              data: update.updates
            });
          } else if (update.source === 'data_final') {
            // If contact info is being updated, reset publisherMatched so user can re-mark as publisher
            if (update.updates.contactEmail || update.updates.contactName) {
              update.updates.publisherMatched = false;
            }
            
            await prisma.dataFinal.update({
              where: { id: update.id },
              data: update.updates
            });
          }
          
          console.log(`[ENHANCED UPDATE] Successfully updated ${update.source} record ${update.id}`);
        }
      }

      // Update task with duplicate count
      await UploadTaskService.update(uploadTask.id, {
        duplicateRecords: duplicateCheck.duplicateCount,
        processedRecords: uniqueRows.length + rowsToUpdateInCurrentSystem.length
      });

      // Log activity
      await ActivityLogService.createLog(
        userId,
        'CSV_UPLOADED',
        'DataUploadTask',
        uploadTask.id,
        {
          fileName: req.file.originalname,
          totalRecords: parsedData.totalRows,
          validRecords: parsedData.validCount,
          uniqueRecords: uniqueRows.length,
          duplicates: duplicateCheck.duplicateCount
        },
        ipAddress,
        userAgent
      );

      // Cleanup file
      cleanupFile(filePath);

      // Get duplicate domains with their sources
      const duplicateDomainsWithSource = duplicateCheck.duplicates
        .filter(d => d.isDuplicate)
        .map(d => ({
          domain: d.websiteUrl,
          source: (d.source === 'main_project' || d.source === 'guest_blog_sites' || d.source === 'pending_sites_pending') ? 'Links Management App' : 
                  d.source === 'data_in_process' ? 'Current System (In Process)' :
                  d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
        }));

      // Count duplicates by source - EXCLUDE price-updated AND price-skipped domains
      // to avoid double-counting (they're already counted in priceUpdates/priceSkipped)
      const priceUpdateUrls = new Set(priceUpdatedDomains.map(d => d.domain.toLowerCase()));
      const priceSkippedUrls = new Set(priceSkippedDomains.map(d => d.domain.toLowerCase()));
      
      // Main project duplicates: exclude price updates AND price-skipped
      const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => 
        d.source === 'Links Management App' && 
        !priceUpdateUrls.has(d.domain.toLowerCase()) &&
        !priceSkippedUrls.has(d.domain.toLowerCase())
      ).length;
      
      // Current system duplicates: exclude price updates AND price-skipped
      const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => 
        d.source.startsWith('Current System') && 
        !priceUpdateUrls.has(d.domain.toLowerCase()) &&
        !priceSkippedUrls.has(d.domain.toLowerCase())
      ).length;
      const totalDuplicates = duplicateCheck.duplicateCount + duplicatesInCSV.length;
      
      // Get list of new domains
      const newDomains = uniqueRows.map(row => row.websiteUrl);

      res.status(201).json({
        success: true,
        message: 'CSV uploaded and processed successfully',
        data: {
          uploadTask,
          summary: {
            totalRows: parsedData.totalRows,
            validRows: parsedData.validCount,
            invalidRows: parsedData.invalidCount,
            uniqueRows: uniqueRows.length,
            duplicateRows: totalDuplicates,
            duplicatesInCSV: duplicatesInCSV.length,
            duplicatesInSystem: duplicateCheck.duplicateCount,
            duplicatesInMainProject: duplicatesInMainProject,
            duplicatesInCurrentSystem: duplicatesInCurrentSystem,
            priceSkipped: priceSkippedDomains.length,
            priceUpdates: priceUpdatedDomains.length
          },
          newDomains: newDomains,
          invalidRows: parsedData.invalidRows,
          duplicateDomains: duplicateDomainsWithSource.map(d => d.domain),
          duplicateDetails: duplicateDomainsWithSource,
          csvDuplicates: duplicatesInCSV,
          priceSkippedDomains: priceSkippedDomains,
          priceUpdatedDomains: priceUpdatedDomains
        }
      });
    } catch (error) {
      if (filePath) cleanupFile(filePath);
      next(error);
    }
  }

  /**
   * Download CSV template (basic)
   */
  static downloadTemplate(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const template = CSVParserService.generateTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=guest_blog_template.csv');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download CSV template with price column
   */
  static downloadTemplateWithPrice(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const template = CSVParserService.generateTemplateWithPrice();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=guest_blog_template_with_price.csv');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download comprehensive CSV template with all fields
   */
  static downloadFullTemplate(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const template = CSVParserService.generateFullTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=guest_blog_full_template.csv');
      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all upload tasks
   */
  static async getUploadTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy, sortOrder, assignedTo, status } = req.query;

      const result = await UploadTaskService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        assignedTo: assignedTo as string,
        status: status as string
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single upload task
   */
  static async getUploadTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await UploadTaskService.getById(id);

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upload task statistics
   */
  static async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.role === 'ADMIN' ? req.user!.id : undefined;
      const stats = await UploadTaskService.getStatistics(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test main project API connection
   */
  static async testMainProjectConnection(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { MainProjectAPIService } = await import('../services/mainProjectAPI.service');
      const result = await MainProjectAPIService.testConnection();

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
          apiUrl: process.env.MAIN_PROJECT_API_URL || 'Not configured',
          serviceEmail: process.env.MAIN_PROJECT_SERVICE_EMAIL || 'Not configured'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
