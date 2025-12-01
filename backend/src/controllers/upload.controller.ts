import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CSVParserService } from '../services/csvParser.service';
import { DuplicateCheckService } from '../services/duplicateCheck.service';
import { UploadTaskService } from '../services/uploadTask.service';
import { DataInProcessService } from '../services/dataInProcess.service';
import { cleanupFile } from '../middleware/upload';
import { ActivityLogService } from '../services/activityLog.service';
import { getClientIp } from '../utils/helpers';

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

      // Now check unique URLs against database and main project
      const websiteUrls = uniqueRowsInCSV.map(row => row.websiteUrl);
      let duplicateCheck;
      
      try {
        duplicateCheck = await DuplicateCheckService.checkBulk(websiteUrls);
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

      // Filter out duplicates from database/main project
      const uniqueRows = uniqueRowsInCSV.filter((row, index) => 
        !duplicateCheck.duplicates[index].isDuplicate
      );

      // Check if there are any new domains to process
      if (uniqueRows.length === 0) {
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
          message: 'No new domains to process. All domains are duplicates.',
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
              duplicatesInCurrentSystem: duplicatesInCurrentSystem
            },
            duplicateDomains: duplicateDomainsWithSource.map(d => d.domain),
            duplicateDetails: duplicateDomainsWithSource,
            csvDuplicates: duplicatesInCSV
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

      // Create data in process records
      await DataInProcessService.bulkCreate(
        uniqueRows.map(row => ({
          ...row,
          price: row.price ? parseFloat(row.price) : undefined,
          uploadTaskId: uploadTask.id
        }))
      );

      // Update task with duplicate count
      await UploadTaskService.update(uploadTask.id, {
        duplicateRecords: duplicateCheck.duplicateCount,
        processedRecords: uniqueRows.length
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
            duplicatesInCurrentSystem: duplicatesInCurrentSystem
          },
          newDomains: newDomains,
          invalidRows: parsedData.invalidRows,
          duplicateDomains: duplicateDomainsWithSource.map(d => d.domain),
          duplicateDetails: duplicateDomainsWithSource,
          csvDuplicates: duplicatesInCSV
        }
      });
    } catch (error) {
      if (filePath) cleanupFile(filePath);
      next(error);
    }
  }

  /**
   * Download CSV template
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
