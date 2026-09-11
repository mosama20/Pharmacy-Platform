import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DbService } from '../database/db.service';
import { BackupService } from './backup.service';

@Injectable()
export class BackupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupScheduler.name);
  private checkInterval: NodeJS.Timeout | null = null;
  private isBackupRunning = false;

  constructor(
    private readonly db: DbService,
    private readonly backupService: BackupService,
  ) {}

  onModuleInit() {
    this.logger.log('⏰ Auto-Backup Scheduler initialized.');
    // Check every 15 minutes if an automated backup is due
    this.checkInterval = setInterval(() => {
      this.evaluateAndRunAutoBackup().catch((err) =>
        this.logger.error(`Error during auto-backup evaluation: ${err.message}`),
      );
    }, 15 * 60 * 1000);

    // Initial check 1 minute after server starts
    setTimeout(() => {
      this.evaluateAndRunAutoBackup().catch(() => {});
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Checks if backup is enabled and interval has passed
   */
  async evaluateAndRunAutoBackup() {
    if (this.isBackupRunning) {
      return;
    }

    const settings = this.db.settings;
    const isEnabled = settings?.autoBackupEnabled !== false; // enabled by default if interval set
    const intervalHours = Number(settings?.autoBackupIntervalHours) || 24;
    const lastBackupAt = settings?.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0;
    const now = Date.now();
    const elapsedHours = (now - lastBackupAt) / (1000 * 60 * 60);

    if (isEnabled && elapsedHours >= intervalHours) {
      this.logger.log(`⏳ Auto-backup is due (elapsed: ${elapsedHours.toFixed(1)} hrs, required: ${intervalHours} hrs). Triggering scheduled backup...`);
      this.isBackupRunning = true;
      try {
        await this.backupService.createFullBackup({
          uploadToDrive: true,
          isAutoBackup: true,
        });
        this.logger.log('✅ Scheduled auto-backup finished successfully.');
      } catch (err: any) {
        this.logger.error(`❌ Scheduled auto-backup failed: ${err.message}`);
      } finally {
        this.isBackupRunning = false;
      }
    }
  }
}
