import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
const AdmZip = require('adm-zip');
import { DbService } from '../database/db.service';
import { PrismaService } from '../database/prisma.service';
import { GoogleDriveService, DriveFileInfo } from './google-drive.service';
import { TelegramService } from '../notifications/telegram.service';
import { EmailService } from '../notifications/email.service';

export interface BackupMetadata {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  scope: string;
  source: 'local' | 'drive';
  webViewLink?: string;
  recordsCount?: {
    users: number;
    products: number;
    orders: number;
    prescriptions: number;
    refills: number;
    categories: number;
    promoCodes: number;
    banners: number;
    articles: number;
  };
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.resolve(process.cwd(), 'data', 'backups');
  private readonly localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly db: DbService,
    private readonly prisma: PrismaService,
    private readonly googleDrive: GoogleDriveService,
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Generates a full system backup containing database JSON + all uploaded files
   */
  async createFullBackup(options: {
    uploadToDrive?: boolean;
    isAutoBackup?: boolean;
  } = {}): Promise<BackupMetadata> {
    const timestampStr = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0];
    const backupFilename = `chefaa-backup-${timestampStr}.chefaabak`;
    const tempZipPath = path.join(this.backupDir, backupFilename);

    this.logger.log(`Starting full system backup: ${backupFilename}...`);

    // 1. Snapshot full database from Postgres and memory
    let [users, products, categories, orders, prescriptions, refills, banners, promoCodes, articles, auditLogs, settingsRecord] =
      await Promise.all([
        this.prisma.user.findMany().catch(() => this.db.users),
        this.prisma.product.findMany().catch(() => this.db.products),
        this.prisma.category.findMany().catch(() => this.db.categories),
        this.prisma.order.findMany({ include: { items: true } }).catch(() => this.db.orders),
        this.prisma.prescription.findMany().catch(() => this.db.prescriptions),
        this.prisma.refillSubscription.findMany().catch(() => this.db.refills),
        this.prisma.heroBanner.findMany().catch(() => this.db.banners),
        this.prisma.promoCode.findMany().catch(() => this.db.promoCodes),
        this.prisma.article.findMany().catch(() => this.db.articles),
        this.prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } }).catch(() => []),
        this.prisma.platformSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      ]);

    // Fallbacks if Postgres arrays are empty
    if (!products || products.length === 0) products = this.db.products as any;
    if (!orders || orders.length === 0) orders = this.db.orders as any;
    if (!prescriptions || prescriptions.length === 0) prescriptions = this.db.prescriptions as any;
    if (!users || users.length === 0) users = this.db.users as any;

    const databasePayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        users,
        products,
        categories,
        orders,
        prescriptions,
        refills,
        banners,
        promoCodes,
        articles,
        auditLogs,
        settings: settingsRecord?.data || this.db.settings,
      },
    };

    const manifestPayload = {
      app: 'Chefaa Healthcare Platform',
      backupType: 'FULL_SYSTEM_SNAPSHOT',
      createdAt: new Date().toISOString(),
      schemaVersion: '1.0',
      recordsCount: {
        users: users.length,
        products: products.length,
        orders: orders.length,
        prescriptions: prescriptions.length,
        refills: refills.length,
        categories: categories.length,
        promoCodes: promoCodes.length,
        banners: banners.length,
        articles: articles.length,
      },
    };

    // 2. Package database JSON + uploads directory into Zip Archive using AdmZip
    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifestPayload, null, 2), 'utf8'));
    zip.addFile('database.json', Buffer.from(JSON.stringify(databasePayload, null, 2), 'utf8'));

    // Append local uploads directory if present
    if (fs.existsSync(this.localUploadDir)) {
      const uploadFiles = fs.readdirSync(this.localUploadDir);
      if (uploadFiles.length > 0) {
        zip.addLocalFolder(this.localUploadDir, 'uploads');
      }
    }

    zip.writeZip(tempZipPath);

    const fileStats = fs.statSync(tempZipPath);
    const sizeInMb = (fileStats.size / (1024 * 1024)).toFixed(2);
    this.logger.log(`Backup archive created successfully: ${backupFilename} (${sizeInMb} MB)`);

    // 3. Upload to Google Drive if requested or auto-backup with drive enabled
    let webViewLink: string | undefined;
    const shouldUploadToDrive =
      options.uploadToDrive ||
      (this.db.settings?.googleDriveEnabled && this.db.settings?.googleDriveFolderId);

    if (shouldUploadToDrive) {
      try {
        const driveRes = await this.googleDrive.uploadFile(tempZipPath, backupFilename);
        if (driveRes.success) {
          webViewLink = driveRes.webViewLink;
          this.logger.log(`Google Drive backup sync completed: ${webViewLink || driveRes.fileId}`);
        } else {
          this.logger.warn(`Google Drive upload returned error: ${driveRes.error}`);
        }
      } catch (err: any) {
        this.logger.error(`Google Drive upload failed: ${err.message}`);
      }
    }

    // 4. Update last backup timestamp in platform settings
    this.db.settings.lastBackupAt = new Date().toISOString();
    this.db.persist();

    // 5. Send Telegram & Email confirmation alert
    const alertMessage = `
🛡️ <b>تم إنشاء نسخة احتياطية كاملة للمنصة بنجاح!</b>
━━━━━━━━━━━━━━━━━━━━
📦 <b>اسم الملف:</b> <code>${backupFilename}</code>
📊 <b>حجم النسخة:</b> <b>${sizeInMb} MB</b>
📅 <b>التوقيت:</b> ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
🏷️ <b>النوع:</b> ${options.isAutoBackup ? 'نسخ تلقائي مجدول (Auto-Schedule)' : 'نسخ يدوي فوري (Manual)'}
☁️ <b>التخزين السحابي:</b> ${webViewLink ? '✅ تم الرفع على Google Drive' : '📁 محفوظ محلياً على السيرفر'}
👥 <b>البيانات المنسوخة:</b>
• المنتجات: ${products.length} منتج
• الطلبات: ${orders.length} طلب
• الروشتات: ${prescriptions.length} روشتة
• العملاء والمستخدمين: ${users.length} مستخدم
• ملفات الصور والروشتات: مُضمنة بالكامل داخل الأرشيف
━━━━━━━━━━━━━━━━━━━━
⚡ <i>منصة شفاء للرعاية الصحية والصيدلية الذكية</i>
    `.trim();

    this.telegramService.sendTextMessage(alertMessage).catch(() => {});
    if (this.db.settings.adminNotificationEmail && this.db.settings.emailNotificationsEnabled) {
      this.emailService
        .sendAdminCustomAlert('تقرير النسخ الاحتياطي لمنصة الصيدلية', alertMessage)
        .catch(() => {});
    }

    return {
      filename: backupFilename,
      sizeBytes: fileStats.size,
      createdAt: new Date().toISOString(),
      scope: 'Full Database & Uploads Archive',
      source: 'local',
      webViewLink,
      recordsCount: manifestPayload.recordsCount,
    };
  }

  /**
   * List all available backups (local + Google Drive)
   */
  async listAllBackups(): Promise<{
    localBackups: BackupMetadata[];
    driveBackups: DriveFileInfo[];
    totalCount: number;
    lastBackupAt?: string;
  }> {
    const localBackups: BackupMetadata[] = [];

    if (fs.existsSync(this.backupDir)) {
      const files = fs.readdirSync(this.backupDir);
      for (const file of files) {
        if (file.endsWith('.chefaabak') || file.endsWith('.zip')) {
          try {
            const fullPath = path.join(this.backupDir, file);
            const stats = fs.statSync(fullPath);
            localBackups.push({
              filename: file,
              sizeBytes: stats.size,
              createdAt: stats.birthtime.toISOString(),
              scope: 'Full Database & Uploads Archive',
              source: 'local',
            });
          } catch (e) {}
        }
      }
    }

    // Sort newest first
    localBackups.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // List remote backups from Google Drive if available
    let driveBackups: DriveFileInfo[] = [];
    try {
      driveBackups = await this.googleDrive.listBackups();
    } catch (e) {}

    return {
      localBackups,
      driveBackups,
      totalCount: localBackups.length + driveBackups.length,
      lastBackupAt: this.db.settings.lastBackupAt,
    };
  }

  /**
   * Get file path for download
   */
  getBackupFilePath(filename: string): string {
    const cleanFilename = path.basename(filename);
    const fullPath = path.join(this.backupDir, cleanFilename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود');
    }
    return fullPath;
  }

  /**
   * Delete a local backup file
   */
  async deleteBackup(filename: string): Promise<{ success: boolean }> {
    const cleanFilename = path.basename(filename);
    const fullPath = path.join(this.backupDir, cleanFilename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود');
    }
    fs.unlinkSync(fullPath);
    return { success: true };
  }

  /**
   * Restore full system from backup archive file
   */
  async restoreFromArchive(archiveFilePath: string): Promise<{
    success: boolean;
    restoredCounts: Record<string, number>;
  }> {
    if (!fs.existsSync(archiveFilePath)) {
      throw new BadRequestException('ملف الأرشيف غير موجود');
    }

    this.logger.log(`Starting system restore from: ${archiveFilePath}`);

    const zip = new AdmZip(archiveFilePath);
    const zipEntries = zip.getEntries();

    // 1. Validate manifest and database files exist in archive
    const databaseEntry = zipEntries.find((e) => e.entryName === 'database.json');
    if (!databaseEntry) {
      throw new BadRequestException('الأرشيف غير صالح: ملف قاعدة البيانات database.json مفقود داخل النسخة الاحتياطية.');
    }

    const databaseRaw = databaseEntry.getData().toString('utf8');
    let databaseParsed: any;
    try {
      databaseParsed = JSON.parse(databaseRaw);
    } catch (err) {
      throw new BadRequestException('فشل فك شفرة ملف قاعدة البيانات database.json');
    }

    const data = databaseParsed.data || databaseParsed;

    // 2. Restore uploads folder from zip
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
        const relativeName = entry.entryName.replace(/^uploads\//, '');
        const targetPath = path.join(this.localUploadDir, relativeName);
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      }
    }

    // 3. Restore in-memory data
    if (Array.isArray(data.users) && data.users.length > 0) this.db.users = data.users;
    if (Array.isArray(data.products)) this.db.products = data.products;
    if (Array.isArray(data.categories)) this.db.categories = data.categories;
    if (Array.isArray(data.orders)) this.db.orders = data.orders;
    if (Array.isArray(data.prescriptions)) this.db.prescriptions = data.prescriptions;
    if (Array.isArray(data.refills)) this.db.refills = data.refills;
    if (Array.isArray(data.banners)) this.db.banners = data.banners;
    if (Array.isArray(data.promoCodes)) this.db.promoCodes = data.promoCodes;
    if (Array.isArray(data.articles)) this.db.articles = data.articles;
    if (data.settings) this.db.settings = { ...this.db.settings, ...data.settings };

    // 4. Sync restored data into PostgreSQL database
    try {
      // Clear and rewrite products
      if (Array.isArray(data.products) && data.products.length > 0) {
        await this.prisma.orderItem.deleteMany().catch(() => {});
        await this.prisma.product.deleteMany().catch(() => {});
        for (const p of data.products) {
          await this.prisma.product.upsert({
            where: { id: p.id },
            update: {
              nameAr: p.nameAr,
              nameEn: p.nameEn,
              price: Number(p.price) || 0,
              stock: Number(p.stock) || 0,
              category: p.category,
              image: p.image || '',
            },
            create: {
              id: p.id,
              nameAr: p.nameAr,
              nameEn: p.nameEn,
              price: Number(p.price) || 0,
              stock: Number(p.stock) || 0,
              category: p.category,
              image: p.image || '',
              rating: Number(p.rating) || 5.0,
            },
          }).catch(() => {});
        }
      }

      // Sync settings
      if (this.db.settings) {
        await this.prisma.platformSettings.upsert({
          where: { id: 'default' },
          update: { data: this.db.settings as any },
          create: { id: 'default', data: this.db.settings as any },
        }).catch(() => {});
      }
    } catch (err) {
      this.logger.warn(`PostgreSQL restore sync partial notice: ${err}`);
    }

    // 5. Persist to storage.json
    await this.db.persistNow();

    const counts = {
      users: (this.db.users || []).length,
      products: (this.db.products || []).length,
      orders: (this.db.orders || []).length,
      prescriptions: (this.db.prescriptions || []).length,
      refills: (this.db.refills || []).length,
      categories: (this.db.categories || []).length,
    };

    this.logger.log(`Restore completed successfully: ${JSON.stringify(counts)}`);
    return { success: true, restoredCounts: counts };
  }
}
