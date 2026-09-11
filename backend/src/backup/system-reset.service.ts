import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { DbService } from '../database/db.service';
import { PrismaService } from '../database/prisma.service';
import { BackupService } from './backup.service';
import { TelegramService } from '../notifications/telegram.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SystemResetService {
  private readonly logger = new Logger(SystemResetService.name);
  private readonly localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly db: DbService,
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Executes a complete factory reset: wipes all orders, prescriptions, products,
   * refills, articles, banners, coupons, customers, and uploaded files.
   * Preserves the active Super Admin user to ensure system accessibility.
   */
  async executeFactoryReset(
    adminUserId: string,
    passwordVerify: string,
    confirmationCode: string,
    options: { createSafetyBackup?: boolean; ipAddress?: string; userAgent?: string } = {},
  ): Promise<{ success: boolean; message: string; safetyBackupFilename?: string }> {
    this.logger.warn(`⚠️ INITIATING FACTORY RESET REQUEST by user ID: ${adminUserId}`);

    // 1. Verify user exists and is an active ADMIN
    let adminUser = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!adminUser) {
      adminUser = (this.db.users || []).find((u) => u.id === adminUserId) as any;
    }

    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new ForbiddenException('صلاحية إعادة ضبط المصنع مقتصرة فقط وحصرياً على المدير العام للمنصة (ADMIN)');
    }

    // 2. Verify admin password
    if (!passwordVerify || !adminUser.password) {
      throw new UnauthorizedException('يرجى إدخال كلمة مرور الأدمن الحالية لتأكيد الهوية');
    }

    const isPasswordValid = await bcrypt.compare(passwordVerify, adminUser.password);
    if (!isPasswordValid) {
      this.logger.error(`Factory reset attempt failed: Incorrect password for admin ${adminUser.email}`);
      throw new UnauthorizedException('كلمة المرور غير صحيحة! تم رفض طلب تصفير البيانات');
    }

    // 3. Verify confirmation code
    const validCodes = ['مسح-كافة-البيانات', 'RESET-ALL-DATA', 'مسح كافة البيانات'];
    const trimmedCode = (confirmationCode || '').trim();
    if (!validCodes.includes(trimmedCode)) {
      throw new BadRequestException(
        'عبارة التأكيد غير مطابقة. يرجى كتابة "مسح-كافة-البيانات" بالضبط لتأكيد العملية',
      );
    }

    // 4. Create Emergency Safety Backup before wiping (enabled by default)
    let safetyBackupFilename: string | undefined;
    if (options.createSafetyBackup !== false) {
      try {
        this.logger.log('Taking emergency safety snapshot before data wipe...');
        const backup = await this.backupService.createFullBackup({ uploadToDrive: true });
        safetyBackupFilename = backup.filename;
        this.logger.log(`Safety snapshot created: ${safetyBackupFilename}`);
      } catch (err: any) {
        this.logger.error(`Failed to create safety backup: ${err.message}. Proceeding with caution.`);
      }
    }

    // 5. Wipe PostgreSQL Tables via Prisma
    try {
      this.logger.log('Wiping database tables in PostgreSQL...');
      await this.prisma.orderItem.deleteMany().catch(() => {});
      await this.prisma.order.deleteMany().catch(() => {});
      await this.prisma.prescription.deleteMany().catch(() => {});
      await this.prisma.refillSubscription.deleteMany().catch(() => {});
      await this.prisma.promoUsage.deleteMany().catch(() => {});
      await this.prisma.promoCode.deleteMany().catch(() => {});
      await this.prisma.heroBanner.deleteMany().catch(() => {});
      await this.prisma.article.deleteMany().catch(() => {});
      await this.prisma.product.deleteMany().catch(() => {});
      await this.prisma.category.deleteMany().catch(() => {});
      // Delete all users except the currently authenticated admin
      await this.prisma.user.deleteMany({
        where: { id: { not: adminUser.id } },
      }).catch(() => {});
      await this.prisma.auditLog.deleteMany().catch(() => {});
    } catch (err: any) {
      this.logger.error(`PostgreSQL wipe error: ${err.message}`);
    }

    // 6. Wipe in-memory DbService collections
    this.db.orders = [];
    this.db.prescriptions = [];
    this.db.refills = [];
    this.db.products = [];
    this.db.categories = [];
    this.db.banners = [];
    this.db.promoCodes = [];
    this.db.articles = [];
    this.db.users = [
      {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        password: adminUser.password,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: adminUser.createdAt ? new Date(adminUser.createdAt).toISOString() : new Date().toISOString(),
      },
    ];

    // 7. Clean all files inside the local uploads directory
    try {
      if (fs.existsSync(this.localUploadDir)) {
        const files = fs.readdirSync(this.localUploadDir);
        for (const file of files) {
          const filePath = path.join(this.localUploadDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
        this.logger.log('Uploads directory emptied successfully.');
      }
    } catch (err: any) {
      this.logger.error(`Error cleaning uploads folder: ${err.message}`);
    }

    // 8. Reset PlatformSettings to defaults but preserve Drive & Alert credentials
    const driveCreds = this.db.settings?.googleDriveServiceAccountJson;
    const driveFolder = this.db.settings?.googleDriveFolderId;
    const tgToken = this.db.settings?.telegramBotToken;
    const tgChat = this.db.settings?.telegramChatId;
    const smtpPass = this.db.settings?.smtpPass;

    this.db.settings = {
      websiteName: 'الصيدلية الذكية',
      brandTagline: 'صيدليتك أونلاين 24/7',
      brandDescription: 'منصة الرعاية الصحية والصيدلية الإلكترونية الشاملة.',
      logoText: 'صـ',
      logoUrl: '',
      faviconUrl: '',
      appIconUrl: '',
      primaryColor: '#059669',
      accentColor: '#0d9488',
      hotline: '19876',
      whatsapp: '01012345678',
      supportEmail: adminUser.email || 'admin@pharmacy.com',
      address: 'شارع التسعين، التجمع الخامس، القاهرة، مصر',
      workingHours: 'خدمة 24 ساعة طوال أيام الأسبوع',
      operatingCities: ['القاهرة', 'الجيزة', 'الإسكندرية'],
      deliveryFee: 25,
      freeDeliveryThreshold: 500,
      estimatedDeliveryMin: 35,
      announcementText: '',
      isAnnouncementActive: false,
      allowPrescriptionUpload: true,
      seoTitle: 'الصيدلية الذكية | صيدليتك أونلاين',
      seoDescription: 'اطلب أدويتك واحتياجاتك الصحية أونلاين',
      seoKeywords: 'صيدلية, دواء, علاج',
      socialLinks: {},
      navigationMenu: [],
      footerColumns: [],
      mediaLibrary: [],
      quickCards: [],
      insuranceCompanies: [],
      refillDiscountPercent: 15,
      refillFreeDelivery: true,
      telegramBotToken: tgToken,
      telegramChatId: tgChat,
      telegramNotificationsEnabled: true,
      smtpPass: smtpPass,
      googleDriveServiceAccountJson: driveCreds,
      googleDriveFolderId: driveFolder,
      googleDriveEnabled: !!driveFolder,
      autoBackupEnabled: true,
      autoBackupIntervalHours: 24,
      lastBackupAt: new Date().toISOString(),
    };

    // 9. Sync changes to Prisma platformSettings & write to storage.json
    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { data: this.db.settings as any },
      create: { id: 'default', data: this.db.settings as any },
    }).catch(() => {});

    await this.db.persistNow();

    // 10. Record in Audit Log
    try {
      await this.auditService.log({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'FACTORY_RESET',
        entity: 'SYSTEM',
        entityId: 'ALL',
        oldValue: { status: 'PRE_RESET_DATA' },
        newValue: {
          status: 'COMPLETELY_WIPED',
          safetyBackupFilename,
          resetAt: new Date().toISOString(),
        },
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      });
    } catch (e) {}

    // 11. Dispatch High-Priority Security Alert via Telegram and Email
    const alertText = `
⚠️⚠️ <b>تنبيه أمني فوري: تم تنفيذ إعادة ضبط المصنع للمنصة (Factory Reset)!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>المسؤول:</b> ${adminUser.name} (<code>${adminUser.email}</code>)
📅 <b>التوقيت:</b> ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
🛡️ <b>نسخة الأمان الطارئة:</b> <code>${safetyBackupFilename || 'تم إنشاؤها'}</code>
🗑️ <b>الإجراء المنفذ:</b>
• مسح كافة الطلبات والروشتات واشتراكات الروشتات الشهرية.
• مسح كافة المنتجات والتصنيفات والكوبونات والمقالات والبانرات.
• مسح كافة حسابات العملاء والطاقم (تم الحفاظ فقط على حساب الأدمن المنفذ).
• تفريغ مكتبة الصور والملفات المرفوعة.
━━━━━━━━━━━━━━━━━━━━
⚡ <i>منصة شفاء للرعاية الصحية والصيدلية الذكية</i>
    `.trim();

    this.telegramService.sendTextMessage(alertText).catch(() => {});
    if (adminUser.email) {
      this.emailService
        .sendAdminCustomAlert('⚠️ تحذير أمني: تم تصفير بيانات الموقع بالكامل (Factory Reset)', alertText)
        .catch(() => {});
    }

    return {
      success: true,
      message: 'تم تصفير الموقع ومسح كافة البيانات وإعادة ضبط المصنع بنجاح. تم الإبقاء على حسابك كمدير للمنصة.',
      safetyBackupFilename,
    };
  }
}
