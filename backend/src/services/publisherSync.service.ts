import prisma from '../config/database';
import { MainProjectAPIService } from './mainProjectAPI.service';

/**
 * Service to sync publisher information across all sites with the same email
 * This ensures that when a publisher is created in the main tool for one site,
 * all other sites with the same email are automatically updated with the publisher info
 */
export class PublisherSyncService {
  /**
   * Sync publisher information for all sites with matching emails
   * This should be called after pushing sites to the main tool
   */
  static async syncPublishersByEmail(emails: string[]): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    if (!emails || emails.length === 0) {
      return { success: true, synced: 0, errors: [] };
    }

    console.log('[PublisherSync] Starting sync for emails:', emails);
    
    try {
      // Fetch latest publishers from main tool
      const publishersResult = await MainProjectAPIService.fetchPublishers();
      
      if (!publishersResult.success || !publishersResult.publishers) {
        console.log('[PublisherSync] Failed to fetch publishers from main tool');
        return { success: false, synced: 0, errors: ['Failed to fetch publishers from main tool'] };
      }

      console.log('[PublisherSync] Fetched', publishersResult.publishers.length, 'publishers from main tool');

      let syncedCount = 0;
      const errors: string[] = [];

      // Process each email
      for (const email of emails) {
        const emailLower = email.toLowerCase().trim();
        
        // Find publisher in main tool by email
        const publisher = publishersResult.publishers.find(p => 
          p.email?.toLowerCase().trim() === emailLower
        );

        if (!publisher) {
          console.log(`[PublisherSync] No publisher found in main tool for email: ${email}`);
          continue;
        }

        console.log(`[PublisherSync] Found publisher in main tool:`, {
          id: publisher.id,
          email: publisher.email,
          name: publisher.publisherName
        });

        // Update all sites in data_in_process with this email
        // Only update if they don't already have a real publisher ID (not pending_...)
        const updatedInProcess = await prisma.dataInProcess.updateMany({
          where: {
            AND: [
              {
                OR: [
                  { publisherEmail: emailLower },
                  { contactEmail: emailLower }
                ]
              },
              {
                OR: [
                  { publisherId: null },
                  { publisherId: { startsWith: 'pending_' } },
                  { publisherMatched: false }
                ]
              }
            ]
          },
          data: {
            publisherId: publisher.id,
            publisherMatched: true,
            publisherName: publisher.publisherName,
            publisherEmail: publisher.email || emailLower,
            // Clear contact fields since we now have a matched publisher
            contactEmail: null,
            contactName: null
          }
        });

        console.log(`[PublisherSync] Updated ${updatedInProcess.count} records in data_in_process for ${email}`);

        // Update all sites in data_final with this email
        const updatedInFinal = await prisma.dataFinal.updateMany({
          where: {
            AND: [
              {
                OR: [
                  { publisherEmail: emailLower },
                  { contactEmail: emailLower }
                ]
              },
              {
                OR: [
                  { publisherId: null },
                  { publisherId: { startsWith: 'pending_' } },
                  { publisherMatched: false }
                ]
              }
            ]
          },
          data: {
            publisherId: publisher.id,
            publisherMatched: true,
            publisherName: publisher.publisherName,
            publisherEmail: publisher.email || emailLower,
            // Clear contact fields since we now have a matched publisher
            contactEmail: null,
            contactName: null
          }
        });

        console.log(`[PublisherSync] Updated ${updatedInFinal.count} records in data_final for ${email}`);

        syncedCount += updatedInProcess.count + updatedInFinal.count;
      }

      console.log(`[PublisherSync] Total synced: ${syncedCount} records`);

      return {
        success: true,
        synced: syncedCount,
        errors
      };
    } catch (error: any) {
      console.error('[PublisherSync] Error:', error.message);
      return {
        success: false,
        synced: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Sync publishers for specific site records
   * Useful when you know which records were just pushed
   */
  static async syncPublishersForRecords(records: Array<{
    publisherEmail?: string | null;
    contactEmail?: string | null;
  }>): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    // Extract unique emails from records
    const emails = new Set<string>();
    
    for (const record of records) {
      const email = record.publisherEmail || record.contactEmail;
      if (email && email.trim()) {
        emails.add(email.toLowerCase().trim());
      }
    }

    if (emails.size === 0) {
      console.log('[PublisherSync] No emails to sync');
      return { success: true, synced: 0, errors: [] };
    }

    console.log('[PublisherSync] Syncing publishers for', emails.size, 'unique emails');

    return this.syncPublishersByEmail(Array.from(emails));
  }

  /**
   * Sync all existing records that have contact/publisher emails
   * This runs periodically to ensure all records are synced with main tool publishers
   */
  static async syncAllExistingRecords(): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    console.log('[PublisherSync] Starting automatic sync for all existing records...');
    
    try {
      // Collect all unique emails from both tables
      const emails = new Set<string>();

      // Get emails from data_in_process
      const inProcessRecords = await prisma.dataInProcess.findMany({
        where: {
          AND: [
            {
              OR: [
                { publisherEmail: { not: null } },
                { contactEmail: { not: null } }
              ]
            },
            {
              OR: [
                { publisherId: null },
                { publisherId: { startsWith: 'pending_' } },
                { publisherMatched: false }
              ]
            }
          ]
        },
        select: {
          publisherEmail: true,
          contactEmail: true
        }
      });

      for (const record of inProcessRecords) {
        const email = record.publisherEmail || record.contactEmail;
        if (email && email.trim()) {
          emails.add(email.toLowerCase().trim());
        }
      }

      // Get emails from data_final
      const finalRecords = await prisma.dataFinal.findMany({
        where: {
          AND: [
            {
              OR: [
                { publisherEmail: { not: null } },
                { contactEmail: { not: null } }
              ]
            },
            {
              OR: [
                { publisherId: null },
                { publisherId: { startsWith: 'pending_' } },
                { publisherMatched: false }
              ]
            }
          ]
        },
        select: {
          publisherEmail: true,
          contactEmail: true
        }
      });

      for (const record of finalRecords) {
        const email = record.publisherEmail || record.contactEmail;
        if (email && email.trim()) {
          emails.add(email.toLowerCase().trim());
        }
      }

      if (emails.size === 0) {
        console.log('[PublisherSync] No records need syncing');
        return { success: true, synced: 0, errors: [] };
      }

      console.log(`[PublisherSync] Found ${emails.size} unique emails to sync`);

      // Sync all emails
      return this.syncPublishersByEmail(Array.from(emails));
    } catch (error: any) {
      console.error('[PublisherSync] Error in automatic sync:', error.message);
      return {
        success: false,
        synced: 0,
        errors: [error.message]
      };
    }
  }
}
