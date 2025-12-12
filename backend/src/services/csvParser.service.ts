import fs from 'fs';
import Papa from 'papaparse';
import { CSVRow, ParsedCSVData } from '../types/upload.types';
import { normalizeDomain, isValidEmail, isValidDomain } from '../utils/helpers';
import { CATEGORIES, COUNTRIES, LANGUAGES } from '../config/constants';

export class CSVParserService {
  /**
   * Parse CSV file and validate data
   */
  static async parseCSV(filePath: string): Promise<ParsedCSVData> {
    return new Promise((resolve, reject) => {
      const validRows: CSVRow[] = [];
      const invalidRows: Array<{ row: number; data: any; errors: string[] }> = [];
      let rowNumber = 0;

      const fileStream = fs.createReadStream(filePath);

      Papa.parse(fileStream, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize header names
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        },
        step: (result: any) => {
          rowNumber++;
          const row = result.data;
          const errors: string[] = [];

          // Accept "Site", "Domain", "website_url", "url", or "website" as column name
          const websiteUrl = row.site || row.domain || row.website_url || row.websiteurl || row.url || row.website;

          // Validate required field: domain/site
          if (!websiteUrl) {
            errors.push('Site/Domain is required');
          }

          // Validate domain format
          if (websiteUrl && !isValidDomain(websiteUrl)) {
            errors.push('Invalid domain format');
          }

          if (errors.length > 0) {
            invalidRows.push({
              row: rowNumber,
              data: row,
              errors
            });
          } else {
            // Extract price if provided (GB Base Price column)
            const priceValue = row.gb_base_price || row.price || row.base_price || row.gbbaseprice;
            let price: number | undefined = undefined;
            
            if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
              const parsedPrice = parseFloat(priceValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedPrice) && parsedPrice >= 0) {
                price = parsedPrice;
              }
            }

            // Store the normalized domain and price (if provided)
            const validRow: CSVRow = {
              websiteUrl: normalizeDomain(websiteUrl),
              price: price !== undefined ? price.toString() : undefined
              // All other fields (category, language, country, DA, DR, publisher info, etc.) 
              // will be empty and filled later in "Data in Process" page
            };

            validRows.push(validRow);
          }
        },
        complete: () => {
          resolve({
            validRows,
            invalidRows,
            totalRows: rowNumber,
            validCount: validRows.length,
            invalidCount: invalidRows.length
          });
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Generate CSV template (basic - Site only)
   */
  static generateTemplate(): string {
    const headers = ['Site'];
    const exampleRows = [
      'example.com',
      'https://example2.com',
      'www.example3.com',
      'http://example4.com'
    ];

    return `${headers.join(',')}\n${exampleRows.join('\n')}`;
  }

  /**
   * Generate CSV template with price column
   */
  static generateTemplateWithPrice(): string {
    const headers = ['Site', 'GB Base Price'];
    const exampleRows = [
      'example.com,50',
      'https://example2.com,75',
      'www.example3.com,100',
      'http://example4.com,125'
    ];

    return `${headers.join(',')}\n${exampleRows.join('\n')}`;
  }

  /**
   * Validate CSV headers
   */
  static validateHeaders(filePath: string): Promise<{ valid: boolean; missingHeaders?: string[] }> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      let headers: string[] = [];

      Papa.parse(fileStream, {
        header: true,
        preview: 1,
        transformHeader: (header: string) => {
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        },
        complete: (results: any) => {
          headers = results.meta.fields || [];
          
          // Check for required header (at least one URL field)
          const urlHeaders = ['website_url', 'websiteurl', 'url', 'website'];
          const hasUrlHeader = urlHeaders.some(h => headers.includes(h));

          if (!hasUrlHeader) {
            resolve({
              valid: false,
              missingHeaders: ['website_url (or url, website, websiteurl)']
            });
          } else {
            resolve({ valid: true });
          }
        },
        error: (error: any) => {
          reject(new Error(`Header validation error: ${error.message}`));
        }
      });
    });
  }
}
