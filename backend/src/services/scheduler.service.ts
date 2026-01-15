import { PublisherSyncService } from './publisherSync.service';

/**
 * Scheduler service for running periodic background jobs
 */
export class SchedulerService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the publisher sync scheduler (runs every 5 minutes)
   */
  static startPublisherSync() {
    if (this.isRunning) {
      console.log('[Scheduler] Publisher sync already running');
      return;
    }

    console.log('[Scheduler] Starting automatic publisher sync (every 5 minutes)...');
    this.isRunning = true;

    // Run immediately on startup
    this.runPublisherSync();

    // Then run every 5 minutes (300000 milliseconds)
    this.syncInterval = setInterval(() => {
      this.runPublisherSync();
    }, 300000); // 5 minutes

    console.log('[Scheduler] Publisher sync scheduler started successfully');
  }

  /**
   * Stop the publisher sync scheduler
   */
  static stopPublisherSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('[Scheduler] Publisher sync scheduler stopped');
    }
  }

  /**
   * Run publisher sync once
   */
  private static async runPublisherSync() {
    try {
      console.log('\n========================================');
      console.log('[Scheduler] Running automatic publisher sync...');
      console.log('Time:', new Date().toISOString());
      
      const result = await PublisherSyncService.syncAllExistingRecords();
      
      if (result.success) {
        console.log(`[Scheduler] ✅ Sync completed: ${result.synced} records updated`);
      } else {
        console.log(`[Scheduler] ❌ Sync failed:`, result.errors);
      }
      console.log('========================================\n');
    } catch (error: any) {
      console.error('[Scheduler] Error running publisher sync:', error.message);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      interval: '5 minutes'
    };
  }
}
