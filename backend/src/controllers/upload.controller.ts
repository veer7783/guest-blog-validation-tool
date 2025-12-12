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
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      // Validate that assignedTo is provided (required for Super Admin)
      if (!req.body.assignedTo) {
        cleanupFile(filePath);
        res.status(400).json({
          success: false,
          error: { message: 'User assignment is required before uploading' }
        });
        return;
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
            priceCheckResults = await MainProjectAPIService.checkPrices(sitesWithPrices);
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
      // Track rows that need price update in current system (not new records)
      const rowsToUpdateInCurrentSystem: Array<{ id: string; price: number; source: string }> = [];
      
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
            uniqueRows.push(row);
          } else if (rowPrice > 0) {
            // It's a duplicate with price - check source and compare prices
            
            if (dupCheck.source === 'main_project' && priceResult) {
              // Duplicate in main project - use main project price check
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
                priceSkippedDomains.push({
                  domain: row.websiteUrl,
                  reason: priceResult.action === 'SKIP_SAME' ? 'Same price' : 'Higher price',
                  currentPrice: priceResult.current_price,
                  newPrice: rowPrice
                });
              } else if (priceResult.action === 'CREATE') {
                // Doesn't exist in main project - include it
                uniqueRows.push(row);
              }
            } else if (dupCheck.source === 'data_in_process' || dupCheck.source === 'data_final') {
              // Duplicate in current system - compare with existing price
              const existingPrice = dupCheck.existingPrice || 0;
              
              if (rowPrice < existingPrice) {
                // New price is lower - UPDATE existing record (don't create new)
                rowsToUpdateInCurrentSystem.push({
                  id: dupCheck.existingId!,
                  price: rowPrice,
                  source: dupCheck.source
                });
                priceUpdatedDomains.push({
                  domain: row.websiteUrl,
                  currentPrice: existingPrice,
                  newPrice: rowPrice
                });
              } else if (rowPrice === existingPrice) {
                // Same price - skip
                priceSkippedDomains.push({
                  domain: row.websiteUrl,
                  reason: 'Same price (in current system)',
                  currentPrice: existingPrice,
                  newPrice: rowPrice
                });
              } else {
                // Higher price - skip
                priceSkippedDomains.push({
                  domain: row.websiteUrl,
                  reason: 'Higher price (in current system)',
                  currentPrice: existingPrice,
                  newPrice: rowPrice
                });
              }
            }
          } else {
            // Duplicate without price - skip (old behavior)
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
            source: d.source === 'main_project' ? 'Links Management App' : 
                    d.source === 'data_in_process' ? 'Current System (In Process)' :
                    d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
          }));

        const totalDuplicates = duplicateCheck.duplicateCount + duplicatesInCSV.length;
        
        // Count duplicates by source
        const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => d.source === 'Links Management App').length;
        const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => d.source.startsWith('Current System')).length;

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

      // Handle case where we only have price updates (no new domains)
      if (uniqueRows.length === 0 && rowsToUpdateInCurrentSystem.length > 0) {
        // Update existing records in current system with lower prices
        for (const update of rowsToUpdateInCurrentSystem) {
          if (update.source === 'data_in_process') {
            await prisma.dataInProcess.update({
              where: { id: update.id },
              data: { price: update.price }
            });
          } else if (update.source === 'data_final') {
            await prisma.dataFinal.update({
              where: { id: update.id },
              data: { gbBasePrice: update.price }
            });
          }
        }

        cleanupFile(filePath);

        // Get duplicate domains with their sources
        const duplicateDomainsWithSource = duplicateCheck.duplicates
          .filter(d => d.isDuplicate)
          .map(d => ({
            domain: d.websiteUrl,
            source: d.source === 'main_project' ? 'Links Management App' : 
                    d.source === 'data_in_process' ? 'Current System (In Process)' :
                    d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
          }));

        const totalDuplicates = duplicateCheck.duplicateCount + duplicatesInCSV.length;
        const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => d.source === 'Links Management App').length;
        const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => d.source.startsWith('Current System')).length;

        res.status(200).json({
          success: true,
          message: `Updated prices for ${rowsToUpdateInCurrentSystem.length} existing record(s).`,
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
              priceUpdates: rowsToUpdateInCurrentSystem.length
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
        await DataInProcessService.bulkCreate(
          uniqueRows.map(row => ({
            ...row,
            price: row.price ? parseFloat(row.price) : undefined,
            uploadTaskId: uploadTask.id
          }))
        );
      }

      // Update existing records in current system with lower prices
      if (rowsToUpdateInCurrentSystem.length > 0) {
        for (const update of rowsToUpdateInCurrentSystem) {
          if (update.source === 'data_in_process') {
            await prisma.dataInProcess.update({
              where: { id: update.id },
              data: { price: update.price }
            });
          } else if (update.source === 'data_final') {
            await prisma.dataFinal.update({
              where: { id: update.id },
              data: { gbBasePrice: update.price }
            });
          }
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
          source: d.source === 'main_project' ? 'Links Management App' : 
                  d.source === 'data_in_process' ? 'Current System (In Process)' :
                  d.source === 'data_final' ? 'Current System (Final)' : 'Unknown'
        }));

      // Count duplicates by source
      const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => d.source === 'Links Management App').length;
      const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => d.source.startsWith('Current System')).length;
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
