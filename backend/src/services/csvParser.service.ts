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
            // Extract GB Base Price if provided
            const priceValue = row.gb_base_price || row.price || row.base_price || row.gbbaseprice;
            let price: number | undefined = undefined;
            
            if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
              const parsedPrice = parseFloat(priceValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedPrice) && parsedPrice >= 0) {
                price = parsedPrice;
              }
            }

            // Extract LI Base Price if provided
            const liPriceValue = row.li_base_price || row.libaseprice || row.li_price;
            let liBasePrice: number | undefined = undefined;
            
            if (liPriceValue !== undefined && liPriceValue !== null && liPriceValue !== '') {
              const parsedLiPrice = parseFloat(liPriceValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedLiPrice) && parsedLiPrice >= 0) {
                liBasePrice = parsedLiPrice;
              }
            }

            // Extract publisher if provided (only check 'publisher' column)
            const publisher = row.publisher || '';

            // Extract additional fields if provided
            const daValue = row.da || row.domain_authority || '';
            const drValue = row.dr || row.domain_rating || '';
            const trafficValue = row.traffic || row.monthly_traffic || '';
            const ssValue = row.ss || row.spam_score || '';
            const keywordsValue = row.keywords || row.number_of_keywords || '';
            const categoryValue = row.category || '';
            const countryValue = row.country || '';
            const languageValue = row.language || '';
            const tatValue = row.tat || row.turnaround_time || '';

            // Parse numeric values with validation
            let da: number | undefined = undefined;
            let dr: number | undefined = undefined;
            let traffic: number | undefined = undefined;
            let ss: number | undefined = undefined;
            let keywords: number | undefined = undefined;

            if (daValue && daValue !== '') {
              const parsedDA = parseFloat(daValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedDA) && parsedDA >= 0 && parsedDA <= 100) {
                da = parsedDA;
              }
            }

            if (drValue && drValue !== '') {
              const parsedDR = parseFloat(drValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedDR) && parsedDR >= 0 && parsedDR <= 100) {
                dr = parsedDR;
              }
            }

            if (trafficValue && trafficValue !== '') {
              const parsedTraffic = parseFloat(trafficValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedTraffic) && parsedTraffic >= 0) {
                traffic = parsedTraffic;
              }
            }

            if (ssValue && ssValue !== '') {
              const parsedSS = parseFloat(ssValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedSS) && parsedSS >= 0 && parsedSS <= 100) {
                ss = parsedSS;
              }
            }

            if (keywordsValue && keywordsValue !== '') {
              const parsedKeywords = parseFloat(keywordsValue.toString().replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedKeywords) && parsedKeywords >= 0) {
                keywords = parsedKeywords;
              }
            }

            // Store the normalized domain and all provided fields (only include non-empty values)
            const validRow: CSVRow = {
              websiteUrl: normalizeDomain(websiteUrl),
              price: price !== undefined ? price.toString() : undefined,
              liBasePrice: liBasePrice !== undefined ? liBasePrice.toString() : undefined,
              publisher: publisher.trim() || undefined,
              // Additional fields - only include if they have values
              ...(da !== undefined && { da: da }),
              ...(dr !== undefined && { dr: dr }),
              ...(traffic !== undefined && { traffic: traffic }),
              ...(ss !== undefined && { ss: ss }),
              ...(keywords !== undefined && { keywords: keywords }),
              ...(categoryValue.trim() && { category: categoryValue.trim() }),
              ...(countryValue.trim() && { country: countryValue.trim() }),
              ...(languageValue.trim() && { language: languageValue.trim() }),
              ...(tatValue.trim() && { tat: tatValue.trim() })
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
   * Generate CSV template (basic - Site and Publisher)
   */
  static generateTemplate(): string {
    const headers = ['Site', 'Publisher'];
    const exampleRows = [
      'example.com,john@publisher.com',
      'https://example2.com,Jane Smith',
      'www.example3.com,',
      'http://example4.com,publisher@email.com'
    ];

    return `${headers.join(',')}\n${exampleRows.join('\n')}`;
  }

  /**
   * Generate CSV template with price column
   */
  static generateTemplateWithPrice(): string {
    const headers = ['Site', 'GB Base Price', 'Publisher'];
    const exampleRows = [
      'example.com,50,john@publisher.com',
      'https://example2.com,75,Jane Smith',
      'www.example3.com,100,',
      'http://example4.com,125,publisher@email.com'
    ];

    return `${headers.join(',')}\n${exampleRows.join('\n')}`;
  }

  /**
   * Generate comprehensive CSV template with all supported fields
   */
  static generateFullTemplate(): string {
    const headers = [
      'Site',
      'GB Base Price',
      'LI Base Price',
      'Publisher',
      'DA',
      'DR', 
      'Traffic',
      'SS',
      'Keywords',
      'Category',
      'Country',
      'Language',
      'TAT'
    ];
    const exampleRows = [
      'example.com,50,45,john@publisher.com,65,70,50000,15,150,Technology,USA,English,3-5 days',
      'https://example2.com,75,70,Jane Smith,80,85,100000,10,250,Health,UK,English,2-4 days',
      'www.example3.com,100,90,,45,50,25000,25,100,Finance,Canada,English,1-3 days',
      'http://example4.com,125,115,publisher@email.com,90,95,200000,5,300,Business,Australia,English,4-7 days'
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
