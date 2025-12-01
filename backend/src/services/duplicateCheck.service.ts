import prisma from '../config/database';
import { DuplicateCheckResult, BulkDuplicateCheckResult } from '../types/upload.types';
import { normalizeDomain } from '../utils/helpers';
import { MainProjectAPIService } from './mainProjectAPI.service';
// import { MainProjectDBService } from './mainProjectDB.service'; // Uncomment when mysql2 is installed

export class DuplicateCheckService {
  /**
   * Check if a single website URL is duplicate
   */
  static async checkSingle(websiteUrl: string): Promise<DuplicateCheckResult> {
    const normalizedUrl = normalizeDomain(websiteUrl);

    // Check in main project first
    const mainProjectDuplicate = await MainProjectAPIService.checkDuplicate(normalizedUrl);
    if (mainProjectDuplicate.isDuplicate) {
      return {
        isDuplicate: true,
        existingId: mainProjectDuplicate.existingId,
        source: 'main_project'
      };
    }

    // Check in DataInProcess
    const dataInProcess = await prisma.dataInProcess.findFirst({
      where: { websiteUrl: normalizedUrl }
    });

    if (dataInProcess) {
      return {
        isDuplicate: true,
        existingId: dataInProcess.id,
        source: 'data_in_process'
      };
    }

    // Check in DataFinal
    const dataFinal = await prisma.dataFinal.findFirst({
      where: { websiteUrl: normalizedUrl }
    });

    if (dataFinal) {
      return {
        isDuplicate: true,
        existingId: dataFinal.id,
        source: 'data_final'
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Check multiple website URLs for duplicates (bulk check)
   */
  static async checkBulk(websiteUrls: string[]): Promise<BulkDuplicateCheckResult> {
    const normalizedUrls = websiteUrls.map(url => normalizeDomain(url));
    const duplicates: Array<{
      websiteUrl: string;
      isDuplicate: boolean;
      existingId?: string;
      source?: string;
    }> = [];

    // Check in main project (bulk)
    const mainProjectDuplicates = await MainProjectAPIService.checkDuplicates(normalizedUrls);

    // Check in local database
    const dataInProcessRecords = await prisma.dataInProcess.findMany({
      where: {
        websiteUrl: { in: normalizedUrls }
      },
      select: { websiteUrl: true, id: true }
    });

    const dataFinalRecords = await prisma.dataFinal.findMany({
      where: {
        websiteUrl: { in: normalizedUrls }
      },
      select: { websiteUrl: true, id: true }
    });

    // Create lookup maps
    const dataInProcessMap = new Map(
      dataInProcessRecords.map(r => [r.websiteUrl, r.id])
    );
    const dataFinalMap = new Map(
      dataFinalRecords.map(r => [r.websiteUrl, r.id])
    );

    // Check each URL
    for (const url of normalizedUrls) {
      // Check main project first
      const mainProjectDup = mainProjectDuplicates.find(d => d.websiteUrl === url);
      if (mainProjectDup?.isDuplicate) {
        duplicates.push({
          websiteUrl: url,
          isDuplicate: true,
          existingId: mainProjectDup.existingId,
          source: 'main_project'
        });
        continue;
      }

      // Check data in process
      if (dataInProcessMap.has(url)) {
        duplicates.push({
          websiteUrl: url,
          isDuplicate: true,
          existingId: dataInProcessMap.get(url),
          source: 'data_in_process'
        });
        continue;
      }

      // Check data final
      if (dataFinalMap.has(url)) {
        duplicates.push({
          websiteUrl: url,
          isDuplicate: true,
          existingId: dataFinalMap.get(url),
          source: 'data_final'
        });
        continue;
      }

      // Not a duplicate
      duplicates.push({
        websiteUrl: url,
        isDuplicate: false
      });
    }

    const duplicateCount = duplicates.filter(d => d.isDuplicate).length;
    const uniqueCount = duplicates.filter(d => !d.isDuplicate).length;

    return {
      duplicates,
      duplicateCount,
      uniqueCount
    };
  }

  /**
   * Filter out duplicates from an array of URLs
   */
  static async filterUnique(websiteUrls: string[]): Promise<string[]> {
    const bulkResult = await this.checkBulk(websiteUrls);
    return bulkResult.duplicates
      .filter(d => !d.isDuplicate)
      .map(d => d.websiteUrl);
  }
}
