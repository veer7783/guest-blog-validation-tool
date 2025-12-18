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
      existingPrice?: number | null;
    }> = [];

    // Check in main project (bulk)
    const mainProjectDuplicates = await MainProjectAPIService.checkDuplicates(normalizedUrls);

    // Check in local database - include price for comparison
    const dataInProcessRecords = await prisma.dataInProcess.findMany({
      where: {
        websiteUrl: { in: normalizedUrls }
      },
      select: { websiteUrl: true, id: true, price: true }
    });

    // Only check unpushed records in dataFinal (mainProjectId is null)
    // Pushed records should NOT block new uploads - they can be re-uploaded with new prices
    const dataFinalRecords = await prisma.dataFinal.findMany({
      where: {
        websiteUrl: { in: normalizedUrls },
        mainProjectId: null  // Only unpushed records count as duplicates
      },
      select: { websiteUrl: true, id: true, gbBasePrice: true }
    });

    // Create lookup maps with price info - keep the record with LOWEST price for each URL
    const dataInProcessMap = new Map<string, { id: string; price: number | null }>();
    for (const r of dataInProcessRecords) {
      const existing = dataInProcessMap.get(r.websiteUrl);
      // Keep the record with the lowest price (or first one if no price)
      if (!existing || (r.price !== null && (existing.price === null || r.price < existing.price))) {
        dataInProcessMap.set(r.websiteUrl, { id: r.id, price: r.price });
      }
    }
    
    const dataFinalMap = new Map<string, { id: string; price: number | null }>();
    for (const r of dataFinalRecords) {
      const existing = dataFinalMap.get(r.websiteUrl);
      // Keep the record with the lowest price (or first one if no price)
      if (!existing || (r.gbBasePrice !== null && (existing.price === null || r.gbBasePrice < existing.price))) {
        dataFinalMap.set(r.websiteUrl, { id: r.id, price: r.gbBasePrice });
      }
    }

    // Debug logging
    console.log('=== DUPLICATE CHECK DEBUG ===');
    console.log('DataInProcess records found:', dataInProcessRecords.length);
    dataInProcessRecords.forEach(r => console.log(`  - ${r.websiteUrl}: $${r.price}`));
    console.log('DataInProcess map (lowest prices):');
    dataInProcessMap.forEach((v, k) => console.log(`  - ${k}: $${v.price}`));
    console.log('=============================');

    // Check each URL - find the source with the LOWEST price
    for (const url of normalizedUrls) {
      const mainProjectDup = mainProjectDuplicates.find(d => d.websiteUrl === url);
      const dataInProcessRecord = dataInProcessMap.get(url);
      const dataFinalRecord = dataFinalMap.get(url);

      // Collect all sources where this URL exists
      const sources: Array<{ source: string; id?: string; price: number | null }> = [];
      
      if (mainProjectDup?.isDuplicate) {
        sources.push({
          source: 'main_project',
          id: mainProjectDup.existingId,
          price: mainProjectDup.existingPrice || null
        });
      }
      
      if (dataInProcessRecord) {
        sources.push({
          source: 'data_in_process',
          id: dataInProcessRecord.id,
          price: dataInProcessRecord.price
        });
      }
      
      if (dataFinalRecord) {
        sources.push({
          source: 'data_final',
          id: dataFinalRecord.id,
          price: dataFinalRecord.price
        });
      }

      if (sources.length === 0) {
        // Not a duplicate anywhere
        duplicates.push({
          websiteUrl: url,
          isDuplicate: false
        });
      } else {
        // Find the source with the LOWEST price (most relevant for comparison)
        // If prices are null, treat as Infinity for comparison
        const bestSource = sources.reduce((best, current) => {
          const bestPrice = best.price ?? Infinity;
          const currentPrice = current.price ?? Infinity;
          return currentPrice < bestPrice ? current : best;
        });

        console.log(`URL ${url}: Found in ${sources.length} sources, using ${bestSource.source} with price $${bestSource.price}`);

        duplicates.push({
          websiteUrl: url,
          isDuplicate: true,
          existingId: bestSource.id,
          source: bestSource.source,
          existingPrice: bestSource.price
        });
      }
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
