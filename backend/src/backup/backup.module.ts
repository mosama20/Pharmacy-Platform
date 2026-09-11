import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { GoogleDriveService } from './google-drive.service';
import { SystemResetService } from './system-reset.service';
import { BackupScheduler } from './backup.scheduler';
import { BackupController } from './backup.controller';
import { DbModule } from '../database/db.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DbModule, NotificationsModule],
  controllers: [BackupController],
  providers: [BackupService, GoogleDriveService, SystemResetService, BackupScheduler],
  exports: [BackupService, GoogleDriveService, SystemResetService],
})
export class BackupModule {}
