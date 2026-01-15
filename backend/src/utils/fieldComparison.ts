import { CSVRow } from '../types/upload.types';

/**
 * Compare CSV row data with existing record data to determine what fields need updating
 * Rules:
 * 1. Skip empty CSV fields (don't overwrite existing data with empty values)
 * 2. Update fields that have different data in CSV compared to existing record
 * 3. Return only the fields that need to be updated
 */
export function compareAndGetUpdates(csvRow: CSVRow, existingData: any, source: 'data_in_process' | 'data_final'): any {
  const updates: any = {};
  let hasUpdates = false;

  // Helper function to check if values are different
  const isDifferent = (csvValue: any, existingValue: any): boolean => {
    // If CSV value is empty/null/undefined, don't update
    if (csvValue === null || csvValue === undefined || csvValue === '') {
      return false;
    }
    
    // If existing value is empty/null/undefined and CSV has value, update
    if (existingValue === null || existingValue === undefined || existingValue === '') {
      return true;
    }
    
    // Compare values (convert to string for comparison)
    return String(csvValue).trim() !== String(existingValue).trim();
  };

  // Price comparison (different field names for different sources)
  // Only update if CSV price is LOWER than existing price
  if (csvRow.price !== undefined) {
    const csvPrice = parseFloat(csvRow.price);
    const existingPrice = source === 'data_final' ? existingData.gbBasePrice : existingData.price;
    
    if (!isNaN(csvPrice) && existingPrice !== null && existingPrice !== undefined) {
      // Only update if CSV price is LOWER (not just different)
      if (csvPrice < existingPrice) {
        if (source === 'data_final') {
          updates.gbBasePrice = csvPrice;
        } else {
          updates.price = csvPrice;
        }
        hasUpdates = true;
      }
    } else if (!isNaN(csvPrice) && (existingPrice === null || existingPrice === undefined)) {
      // If no existing price, add the CSV price
      if (source === 'data_final') {
        updates.gbBasePrice = csvPrice;
      } else {
        updates.price = csvPrice;
      }
      hasUpdates = true;
    }
  }

  // DA (Domain Authority)
  if (csvRow.da !== undefined && isDifferent(csvRow.da, existingData.da)) {
    updates.da = csvRow.da;
    hasUpdates = true;
  }

  // DR (Domain Rating)
  if (csvRow.dr !== undefined && isDifferent(csvRow.dr, existingData.dr)) {
    updates.dr = csvRow.dr;
    hasUpdates = true;
  }

  // Traffic
  if (csvRow.traffic !== undefined && isDifferent(csvRow.traffic, existingData.traffic)) {
    updates.traffic = csvRow.traffic;
    hasUpdates = true;
  }

  // SS (Spam Score)
  if (csvRow.ss !== undefined && isDifferent(csvRow.ss, existingData.ss)) {
    updates.ss = csvRow.ss;
    hasUpdates = true;
  }

  // Keywords
  if (csvRow.keywords !== undefined && isDifferent(csvRow.keywords, existingData.keywords)) {
    updates.keywords = csvRow.keywords;
    hasUpdates = true;
  }

  // Category
  if (csvRow.category && isDifferent(csvRow.category, existingData.category)) {
    updates.category = csvRow.category;
    hasUpdates = true;
  }

  // Country
  if (csvRow.country && isDifferent(csvRow.country, existingData.country)) {
    updates.country = csvRow.country;
    hasUpdates = true;
  }

  // Language
  if (csvRow.language && isDifferent(csvRow.language, existingData.language)) {
    updates.language = csvRow.language;
    hasUpdates = true;
  }

  // TAT (Turn Around Time)
  if (csvRow.tat && isDifferent(csvRow.tat, existingData.tat)) {
    updates.tat = csvRow.tat;
    hasUpdates = true;
  }

  // Publisher/Contact information
  if (csvRow.publisher) {
    const publisherValue = csvRow.publisher.trim();
    const isEmail = publisherValue.includes('@');
    
    if (isEmail) {
      // CSV has email - update contact/publisher email fields
      if (isDifferent(publisherValue, existingData.contactEmail) || 
          isDifferent(publisherValue, existingData.publisherEmail)) {
        updates.contactEmail = publisherValue;
        updates.publisherEmail = publisherValue;
        hasUpdates = true;
      }
    } else {
      // CSV has name - update contact/publisher name fields
      if (isDifferent(publisherValue, existingData.contactName) || 
          isDifferent(publisherValue, existingData.publisherName)) {
        updates.contactName = publisherValue;
        updates.publisherName = publisherValue;
        hasUpdates = true;
      }
    }
  }

  return hasUpdates ? updates : null;
}

/**
 * Check if CSV row should trigger an update based on price comparison
 * This maintains the existing price-based update logic
 */
export function shouldUpdateBasedOnPrice(csvRow: CSVRow, existingData: any, source: 'data_in_process' | 'data_final'): boolean {
  if (!csvRow.price) {
    return false; // No price in CSV, use field comparison logic instead
  }

  const csvPrice = parseFloat(csvRow.price);
  if (isNaN(csvPrice)) {
    return false;
  }

  const existingPrice = source === 'data_final' ? existingData.gbBasePrice : existingData.price;
  
  // Update if CSV price is lower than existing price
  return csvPrice < (existingPrice || Infinity);
}

/**
 * Check if CSV row has any data that differs from existing record
 * This is used to determine if we should update even without price comparison
 */
export function hasFieldUpdates(csvRow: CSVRow, existingData: any, source: 'data_in_process' | 'data_final'): boolean {
  const updates = compareAndGetUpdates(csvRow, existingData, source);
  return updates !== null;
}
