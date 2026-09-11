import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { DbService } from '../database/db.service';

export interface DriveFileInfo {
  id: string;
  name: string;
  size?: number;
  mimeType?: string;
  createdTime?: string;
  webViewLink?: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  constructor(private readonly db: DbService) {}

  /**
   * Parse and authenticate Google Drive client using configured Service Account
   */
  private getDriveClient(customCredentials?: string): drive_v3.Drive | null {
    try {
      const credentialsRaw =
        customCredentials ||
        this.db.settings?.googleDriveServiceAccountJson ||
        process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;

      if (!credentialsRaw || !credentialsRaw.trim()) {
        return null;
      }

      let parsedCreds: any;
      try {
        parsedCreds = JSON.parse(credentialsRaw.trim());
      } catch (err) {
        this.logger.error('Failed to parse Google Drive Service Account JSON:', err);
        return null;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: parsedCreds.client_email,
          private_key: parsedCreds.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      return google.drive({ version: 'v3', auth });
    } catch (err: any) {
      this.logger.error(`Error initializing Google Drive client: ${err.message}`);
      return null;
    }
  }

  /**
   * Test connection to Google Drive
   */
  async testConnection(
    customCredentials?: string,
    customFolderId?: string,
  ): Promise<{ success: boolean; message: string; folderName?: string; email?: string }> {
    try {
      const drive = this.getDriveClient(customCredentials);
      if (!drive) {
        return {
          success: false,
          message: 'لم يتم توفير ملف المفتاح (Service Account JSON) أو البيانات غير صالحة',
        };
      }

      const folderId =
        customFolderId ||
        this.db.settings?.googleDriveFolderId ||
        process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!folderId || !folderId.trim()) {
        return {
          success: false,
          message: 'معرّف المجلد (Folder ID) غير محدد. يرجى إنشاء مجلد في Google Drive ومشاركته مع إيميل الـ Service Account',
        };
      }

      // Check folder access
      const folderRes = await drive.files.get({
        fileId: folderId.trim(),
        fields: 'id, name, mimeType, capabilities',
        supportsAllDrives: true,
      });

      if (!folderRes.data) {
        return { success: false, message: 'تعذر الوصول إلى المجلد المحدد' };
      }

      // Extract client email from creds
      let clientEmail = 'Service Account';
      try {
        const credsRaw =
          customCredentials ||
          this.db.settings?.googleDriveServiceAccountJson ||
          process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
        if (credsRaw) {
          const parsed = JSON.parse(credsRaw);
          clientEmail = parsed.client_email || clientEmail;
        }
      } catch {}

      return {
        success: true,
        message: `تم الاتصال بنجاح بمجلد "${folderRes.data.name}" على Google Drive!`,
        folderName: folderRes.data.name || 'Chefaa Backups',
        email: clientEmail,
      };
    } catch (err: any) {
      this.logger.error(`Google Drive test connection failed: ${err.message}`);
      let userFriendlyMsg = err.message;
      if (err.message?.includes('File not found') || err.status === 404) {
        userFriendlyMsg = 'المجلد غير موجود، أو لم تتم مشاركته (Share Editor) مع إيميل الـ Service Account.';
      } else if (err.message?.includes('invalid_grant')) {
        userFriendlyMsg = 'مفتاح الـ Private Key أو البريد الإلكتروني للـ Service Account غير صالح.';
      }
      return {
        success: false,
        message: `فشل الاتصال بـ Google Drive: ${userFriendlyMsg}`,
      };
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    localFilePath: string,
    customFilename?: string,
  ): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
    try {
      const drive = this.getDriveClient();
      if (!drive) {
        return { success: false, error: 'Google Drive client not configured' };
      }

      const folderId =
        this.db.settings?.googleDriveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!folderId) {
        return { success: false, error: 'Google Drive folder ID missing' };
      }

      if (!fs.existsSync(localFilePath)) {
        return { success: false, error: `Local backup file not found: ${localFilePath}` };
      }

      const fileName = customFilename || path.basename(localFilePath);
      const fileSize = fs.statSync(localFilePath).size;

      this.logger.log(`Uploading backup to Google Drive: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

      const fileMetadata: drive_v3.Schema$File = {
        name: fileName,
        parents: [folderId.trim()],
        description: `نسخة احتياطية كاملة لمنصة الصيدلية (${new Date().toLocaleString('ar-EG')})`,
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(localFilePath),
      };

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, size',
        supportsAllDrives: true,
      });

      this.logger.log(`Backup successfully uploaded to Google Drive! File ID: ${res.data.id}`);

      // Apply retention policy (cleanup old backups)
      const keepCount = Number(this.db.settings?.googleDriveKeepCount) || 10;
      this.cleanupOldBackups(folderId.trim(), keepCount).catch((err) =>
        this.logger.warn(`Failed to cleanup old drive backups: ${err.message}`),
      );

      return {
        success: true,
        fileId: res.data.id || undefined,
        webViewLink: res.data.webViewLink || undefined,
      };
    } catch (err: any) {
      this.logger.error(`Failed to upload backup to Google Drive: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * List backups in Google Drive folder
   */
  async listBackups(): Promise<DriveFileInfo[]> {
    try {
      const drive = this.getDriveClient();
      if (!drive) return [];

      const folderId =
        this.db.settings?.googleDriveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!folderId) return [];

      const res = await drive.files.list({
        q: `'${folderId.trim()}' in parents and trashed = false`,
        fields: 'files(id, name, size, mimeType, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 50,
      });

      return (res.data.files || []).map((f) => ({
        id: f.id || '',
        name: f.name || '',
        size: f.size ? Number(f.size) : undefined,
        mimeType: f.mimeType || undefined,
        createdTime: f.createdTime || undefined,
        webViewLink: f.webViewLink || undefined,
      }));
    } catch (err: any) {
      this.logger.warn(`Could not list Google Drive backups: ${err.message}`);
      return [];
    }
  }

  /**
   * Cleanup old backups on Google Drive beyond the retention limit
   */
  async cleanupOldBackups(folderId: string, keepCount = 10): Promise<void> {
    try {
      const drive = this.getDriveClient();
      if (!drive || keepCount <= 0) return;

      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and name contains 'chefaa-backup'`,
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      const files = res.data.files || [];
      if (files.length > keepCount) {
        const filesToDelete = files.slice(keepCount);
        this.logger.log(`Pruning ${filesToDelete.length} old backups on Google Drive...`);
        for (const file of filesToDelete) {
          if (file.id) {
            await drive.files.delete({ fileId: file.id, supportsAllDrives: true }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Google Drive cleanup error: ${err.message}`);
    }
  }
}
