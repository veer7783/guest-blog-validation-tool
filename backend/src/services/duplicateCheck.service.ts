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
      existingData?: any;
    }> = [];

    // STEP 1: Check in CURRENT TOOL first (data_in_process and data_final)
    const dataInProcessRecords = await prisma.dataInProcess.findMany({
      where: {
        websiteUrl: { in: normalizedUrls }
      },
      select: { 
        websiteUrl: true, 
        id: true, 
        price: true,
        da: true,
        dr: true,
        traffic: true,
        ss: true,
        category: true,
        country: true,
        language: true,
        tat: true,
        publisherName: true,
        publisherEmail: true,
        contactName: true,
        contactEmail: true
      }
    });

    // Only check unpushed records in dataFinal (mainProjectId is null)
    const dataFinalRecords = await prisma.dataFinal.findMany({
      where: {
        websiteUrl: { in: normalizedUrls },
        mainProjectId: null  // Only unpushed records count as duplicates
      },
      select: { 
        websiteUrl: true, 
        id: true, 
        gbBasePrice: true,
        da: true,
        dr: true,
        traffic: true,
        ss: true,
        category: true,
        country: true,
        language: true,
        tat: true,
        publisherName: true,
        publisherEmail: true,
        contactName: true,
        contactEmail: true
      }
    });

    // Create lookup maps - keep the record with LOWEST price for each URL
    const dataInProcessMap = new Map<string, any>();
    for (const r of dataInProcessRecords) {
      const existing = dataInProcessMap.get(r.websiteUrl);
      if (!existing || (r.price !== null && (existing.price === null || r.price < existing.price))) {
        dataInProcessMap.set(r.websiteUrl, r);
      }
    }
    
    const dataFinalMap = new Map<string, any>();
    for (const r of dataFinalRecords) {
      const existing = dataFinalMap.get(r.websiteUrl);
      if (!existing || (r.gbBasePrice !== null && (existing.gbBasePrice === null || r.gbBasePrice < existing.gbBasePrice))) {
        dataFinalMap.set(r.websiteUrl, r);
      }
    }

    // STEP 2: Identify URLs NOT in current tool (need to check main project)
    const urlsNotInCurrentTool: string[] = [];
    const currentToolMap = new Map<string, { source: string; id: string; price: number | null; existingData: any }>();
    
    for (const url of normalizedUrls) {
      const dataInProcessRecord = dataInProcessMap.get(url);
      const dataFinalRecord = dataFinalMap.get(url);
      
      if (dataInProcessRecord) {
        // Found in data_in_process - prioritize this
        currentToolMap.set(url, {
          source: 'data_in_process',
          id: dataInProcessRecord.id,
          price: dataInProcessRecord.price,
          existingData: dataInProcessRecord
        });
      } else if (dataFinalRecord) {
        // Found in data_final
        currentToolMap.set(url, {
          source: 'data_final',
          id: dataFinalRecord.id,
          price: dataFinalRecord.gbBasePrice,
          existingData: dataFinalRecord
        });
      } else {
        // NOT in current tool - need to check main project
        urlsNotInCurrentTool.push(url);
      }
    }

    console.log('=== DUPLICATE CHECK PRIORITY LOGIC ===');
    console.log('Total URLs to check:', normalizedUrls.length);
    console.log('Found in current tool:', currentToolMap.size);
    console.log('Need to check main project:', urlsNotInCurrentTool.length);
    console.log('======================================');

    // STEP 3: Check main project (both guest blog sites AND pending sites) ONLY for URLs not in current tool
    let mainProjectDuplicates: Array<{ websiteUrl: string; isDuplicate: boolean; existingId?: string; existingPrice?: number | null; source?: string }> = [];
    if (urlsNotInCurrentTool.length > 0) {
      mainProjectDuplicates = await MainProjectAPIService.checkDuplicatesAllModules(urlsNotInCurrentTool);
    }

    // STEP 4: Build final results with priority: Current Tool > Main Project
    for (const url of normalizedUrls) {
      const currentToolRecord = currentToolMap.get(url);
      
      if (currentToolRecord) {
        // Found in current tool - use this (don't check main project)
        duplicates.push({
          websiteUrl: url,
          isDuplicate: true,
          existingId: currentToolRecord.id,
          source: currentToolRecord.source,
          existingPrice: currentToolRecord.price,
          existingData: currentToolRecord.existingData
        });
        console.log(`✓ ${url}: Found in CURRENT TOOL (${currentToolRecord.source}) with price $${currentToolRecord.price}`);
      } else {
        // Not in current tool - check main project result
        const mainProjectDup = mainProjectDuplicates.find(d => d.websiteUrl === url);
        
        if (mainProjectDup?.isDuplicate) {
          // Found in main project
          duplicates.push({
            websiteUrl: url,
            isDuplicate: true,
            existingId: mainProjectDup.existingId,
            source: mainProjectDup.source || 'main_project',
            existingPrice: mainProjectDup.existingPrice || null,
            existingData: null
          });
          const sourceModule = mainProjectDup.source || 'main_project';
          console.log(`✓ ${url}: Found in MAIN PROJECT (${sourceModule}) with price $${mainProjectDup.existingPrice}`);
        } else {
          // Not found anywhere - new domain
          duplicates.push({
            websiteUrl: url,
            isDuplicate: false
          });
          console.log(`✓ ${url}: NEW DOMAIN (not in current tool or main project)`);
        }
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
