import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BackupService } from './backup.service';
import { GoogleDriveService } from './google-drive.service';
import { SystemResetService } from './system-reset.service';
import { DbService } from '../database/db.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly systemResetService: SystemResetService,
    private readonly db: DbService,
  ) {}

  /**
   * 1. Get Backup Configuration & Status
   */
  @Get('config')
  getConfig() {
    const settings = this.db.settings;
    return {
      autoBackupEnabled: settings.autoBackupEnabled !== false,
      autoBackupIntervalHours: settings.autoBackupIntervalHours || 24,
      lastBackupAt: settings.lastBackupAt || null,
      googleDriveEnabled: Boolean(settings.googleDriveEnabled),
      googleDriveFolderId: settings.googleDriveFolderId || '',
      hasGoogleDriveCredentials: Boolean(settings.googleDriveServiceAccountJson),
      googleDriveKeepCount: settings.googleDriveKeepCount || 10,
    };
  }

  /**
   * 2. Save Backup Configuration
   */
  @Post('config')
  saveConfig(
    @Body()
    dto: {
      autoBackupEnabled?: boolean;
      autoBackupIntervalHours?: number;
      googleDriveEnabled?: boolean;
      googleDriveFolderId?: string;
      googleDriveServiceAccountJson?: string;
      googleDriveKeepCount?: number;
    },
  ) {
    if (dto.autoBackupEnabled !== undefined) {
      this.db.settings.autoBackupEnabled = Boolean(dto.autoBackupEnabled);
    }
    if (dto.autoBackupIntervalHours !== undefined) {
      this.db.settings.autoBackupIntervalHours = Number(dto.autoBackupIntervalHours) || 24;
    }
    if (dto.googleDriveEnabled !== undefined) {
      this.db.settings.googleDriveEnabled = Boolean(dto.googleDriveEnabled);
    }
    if (dto.googleDriveFolderId !== undefined) {
      this.db.settings.googleDriveFolderId = dto.googleDriveFolderId.trim();
    }
    if (dto.googleDriveServiceAccountJson !== undefined && dto.googleDriveServiceAccountJson.trim()) {
      this.db.settings.googleDriveServiceAccountJson = dto.googleDriveServiceAccountJson.trim();
    }
    if (dto.googleDriveKeepCount !== undefined) {
      this.db.settings.googleDriveKeepCount = Number(dto.googleDriveKeepCount) || 10;
    }

    this.db.persist();
    return { success: true, message: 'تم حفظ إعدادات النسخ الاحتياطي السحابي بنجاح!' };
  }

  /**
   * 3. Test Connection to Google Drive
   */
  @Post('test-drive')
  async testDriveConnection(
    @Body() dto: { credentialsJson?: string; folderId?: string },
  ) {
    return await this.googleDriveService.testConnection(
      dto.credentialsJson,
      dto.folderId,
    );
  }

  /**
   * 4. List All Backups (Local + Google Drive)
   */
  @Get('list')
  async listBackups() {
    return await this.backupService.listAllBackups();
  }

  /**
   * 5. Trigger Immediate Backup
   */
  @Post('create')
  async createBackup(@Body() dto: { uploadToDrive?: boolean }) {
    const backup = await this.backupService.createFullBackup({
      uploadToDrive: dto.uploadToDrive !== false,
      isAutoBackup: false,
    });
    return { success: true, backup };
  }

  /**
   * 6. Download Backup Archive File
   */
  @Get('download/:filename')
  downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.backupService.getBackupFilePath(filename);
    res.download(filePath, filename);
  }

  /**
   * 7. Delete Local Backup File
   */
  @Delete(':filename')
  async deleteBackup(@Param('filename') filename: string) {
    return await this.backupService.deleteBackup(filename);
  }

  /**
   * 8. Restore from an uploaded backup file
   */
  @Post('restore')
  @UseInterceptors(FileInterceptor('backupFile'))
  async restoreBackup(
    @UploadedFile() file: Express.Multer.File,
    @Body('filename') existingFilename?: string,
  ) {
    let filePath: string;

    if (file) {
      // Save uploaded file to temp path
      const tempDir = path.resolve(process.cwd(), 'data', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      filePath = path.join(tempDir, `upload-${Date.now()}.chefaabak`);
      fs.writeFileSync(filePath, file.buffer);
    } else if (existingFilename) {
      filePath = this.backupService.getBackupFilePath(existingFilename);
    } else {
      throw new BadRequestException('يرجى رفع ملف النسخة الاحتياطية أو اختيار نسخة سابقة للاستعادة.');
    }

    try {
      const result = await this.backupService.restoreFromArchive(filePath);
      return result;
    } finally {
      // Clean up temporary uploaded file if created
      if (file && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }
    }
  }

  /**
   * 9. Critical Danger Zone: Factory Reset (Wipe All Data)
   */
  @Post('factory-reset')
  async factoryReset(
    @Req() req: any,
    @Body()
    dto: {
      passwordVerify: string;
      confirmationCode: string;
      createSafetyBackup?: boolean;
    },
  ) {
    const user = req.user;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await this.systemResetService.executeFactoryReset(
      user.userId || user.id,
      dto.passwordVerify,
      dto.confirmationCode,
      {
        createSafetyBackup: dto.createSafetyBackup !== false,
        ipAddress,
        userAgent,
      },
    );
  }
}
