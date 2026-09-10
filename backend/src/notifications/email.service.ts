import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { DbService } from '../database/db.service';

export interface EmailOrderDetails {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: {
    governorate?: string;
    city?: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    landmark?: string;
  };
  deliveryType?: string;
  paymentMethod?: string;
  items: Array<{
    nameAr: string;
    nameEn?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly db: DbService) {}

  private getTransporter(): nodemailer.Transporter | null {
    const host = this.db.settings?.smtpHost || process.env.SMTP_HOST;
    const port = Number(this.db.settings?.smtpPort || process.env.SMTP_PORT || 587);
    const user = this.db.settings?.smtpUser || process.env.SMTP_USER;
    const pass = this.db.settings?.smtpPass || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private getFromAddress(): string {
    return (
      this.db.settings?.smtpFrom ||
      process.env.SMTP_FROM ||
      `"صيدلية د. شيماء" <noreply@pharmacy.com>`
    );
  }

  async sendOrderConfirmationEmail(order: EmailOrderDetails): Promise<{ success: boolean; error?: string }> {
    if (!order.customerEmail) {
      return { success: false, error: 'No customer email provided' };
    }

    const transporter = this.getTransporter();
    const storeName = this.db.settings?.websiteName || 'صيدلية د. شيماء';
    const hotline = this.db.settings?.hotline || '19876';

    const itemsHtml = order.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 8px; text-align: right; color: #1e293b; font-weight: 600;">
            ${it.nameAr || it.nameEn || 'دواء/صنف'}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #64748b;">
            ${it.quantity}
          </td>
          <td style="padding: 12px 8px; text-align: left; color: #059669; font-weight: bold; font-family: monospace;">
            ${(it.price * it.quantity).toFixed(2)} ج.م
          </td>
        </tr>
      `,
      )
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تأكيد طلبك من ${storeName}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800;">${storeName}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.9;">تم تأكيد طلبك بنجاح وجاري تجهيزه الآن 💊</p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 14px; color: #047857;">رقم الطلب الخاص بك:</span>
        <div style="font-size: 20px; font-weight: 800; color: #065f46; font-family: monospace; letter-spacing: 1px; margin-top: 4px;">#${order.orderNumber}</div>
      </div>

      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
        أهلاً بك <strong>${order.customerName}</strong>،<br>
        شكراً لثقتك بصيدليتنا! لقد تم استلام طلبك وتأكيده بنجاح، ويقوم الصيدلي المناوب حالياً بمراجعته وتغليفه تمهيداً لخروجه مع مندوب التوصيل السريع.
      </p>

      <h3 style="margin: 20px 0 10px 0; font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">الأدوية والمنتجات المطلوبة</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569;">
            <th style="padding: 10px 8px; text-align: right;">الصنف</th>
            <th style="padding: 10px 8px; text-align: center;">الكمية</th>
            <th style="padding: 10px 8px; text-align: left;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Financial Summary -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
          <span>المجموع الفرعي:</span>
          <span style="font-family: monospace;">${order.subtotal.toFixed(2)} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
          <span>مصاريف الشحن والتوصيل:</span>
          <span style="font-family: monospace;">${order.deliveryFee.toFixed(2)} ج.م</span>
        </div>
        ${
          order.discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; color: #dc2626;">
                <span>الخصم المطبق:</span>
                <span style="font-family: monospace;">-${order.discount.toFixed(2)} ج.م</span>
              </div>`
            : ''
        }
        <div style="border-top: 1px solid #cbd5e1; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #059669;">
          <span>الإجمالي النهائي المستحق:</span>
          <span style="font-family: monospace;">${order.total.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0 10px 0;">
        <p style="font-size: 13px; color: #64748b; margin: 0;">إذا كان لديك أي استفسار أو تعديل على الطلب، يسعدنا تواصلك مع الخط الساخن: <strong>${hotline}</strong></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>
    `;

    if (!transporter) {
      this.logger.log(
        `[MOCK EMAIL] To: ${order.customerEmail} | Subject: تأكيد طلب #${order.orderNumber} من ${storeName} | Total: ${order.total} EGP`,
      );
      return { success: true };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: order.customerEmail,
        subject: `تأكيد طلبك رقم #${order.orderNumber} - ${storeName}`,
        html: htmlContent,
      });

      this.logger.log(`Order confirmation email sent to ${order.customerEmail}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send order confirmation email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendPrescriptionConfirmationEmail(rx: {
    id: string;
    customerName: string;
    customerEmail?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!rx.customerEmail) return { success: false, error: 'No email provided' };

    const transporter = this.getTransporter();
    const storeName = this.db.settings?.websiteName || 'صيدلية د. شيماء';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
  <div style="max-width: 550px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #059669; text-align: center;">تم استلام الروشتة الطبية بنجاح 📋</h2>
    <p>أهلاً بك <strong>${rx.customerName}</strong>،</p>
    <p>لقد استلم الصيدلي المناوب في <strong>${storeName}</strong> صورتك المرفقة للروشتة برقم مرجعي: <code>#${rx.id}</code>.</p>
    <p>يقوم الصيدلي حالياً بقراءة الأصناف وتجهيز التسعيرة والتواصل معك في أسرع وقت لتأكيد التوصيل.</p>
  </div>
</body>
</html>
    `;

    if (!transporter) {
      this.logger.log(`[MOCK EMAIL] Prescription confirmation to: ${rx.customerEmail} | ID: #${rx.id}`);
      return { success: true };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: rx.customerEmail,
        subject: `تم استلام الروشتة الطبية بنجاح #${rx.id} - ${storeName}`,
        html: htmlContent,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendAdminOrderAlert(order: EmailOrderDetails): Promise<{ success: boolean; error?: string }> {
    const adminEmail =
      this.db.settings?.adminNotificationEmail ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      'wep.osama5@gmail.com';

    const transporter = this.getTransporter();
    const storeName = this.db.settings?.websiteName || 'صيدلية د. شيماء';

    const itemsList = (order.items || [])
      .map(
        (it) => `<li style="margin-bottom: 6px;"><strong>${it.nameAr || it.nameEn || 'صنف'}</strong> × ${it.quantity} (${(it.price * it.quantity).toFixed(2)} ج.م)</li>`
      )
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 8px;">📦 إشعار طلب دواء جديد #${order.orderNumber}</h2>
    <p>تم استلام طلب جديد في <strong>${storeName}</strong> بالبيانات التالية:</p>
    <ul style="line-height: 1.8;">
      <li><strong>اسم العميل:</strong> ${order.customerName}</li>
      <li><strong>رقم الهاتف:</strong> <a href="tel:${order.customerPhone}">${order.customerPhone}</a></li>
      <li><strong>عنوان التوصيل:</strong> ${order.deliveryAddress?.governorate || ''} - ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.street || ''}</li>
      <li><strong>طريقة الدفع:</strong> ${order.paymentMethod || 'الدفع عند الاستلام'}</li>
      <li><strong>المبلغ الإجمالي:</strong> <span style="color: #059669; font-weight: bold;">${order.total} ج.م</span></li>
    </ul>
    <h3>الأدوية والمنتجات المطلوبة:</h3>
    <ul style="line-height: 1.6;">${itemsList}</ul>
    ${order.notes ? `<p><strong>ملاحظات العميل:</strong> ${order.notes}</p>` : ''}
    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">هذا الإشعار التلقائي تم إرساله من منصة ${storeName} لمتابعة الطلبات وتجهيزها فوراً.</p>
  </div>
</body>
</html>
    `;

    if (!transporter) {
      this.logger.log(`[MOCK EMAIL] Admin order alert to: ${adminEmail} | #${order.orderNumber}`);
      return { success: true };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: adminEmail,
        subject: `🔔 طلب جديد #${order.orderNumber} من ${order.customerName} (${order.total} ج.م)`,
        html: htmlContent,
      });
      this.logger.log(`Admin order notification email sent to ${adminEmail}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send admin order alert email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendAdminPrescriptionAlert(rx: {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    notes?: string;
    imageUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const adminEmail =
      this.db.settings?.adminNotificationEmail ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      'wep.osama5@gmail.com';

    const transporter = this.getTransporter();
    const storeName = this.db.settings?.websiteName || 'صيدلية د. شيماء';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #7c3aed; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">📋 إشعار روشتة طبية جديدة #${rx.id}</h2>
    <p>قام مريض برفع روشتة جديدة في <strong>${storeName}</strong> تحتاج مراجعة وتسعير:</p>
    <ul style="line-height: 1.8;">
      <li><strong>اسم المريض:</strong> ${rx.customerName}</li>
      <li><strong>رقم الهاتف:</strong> <a href="tel:${rx.customerPhone}">${rx.customerPhone}</a></li>
      <li><strong>العنوان:</strong> ${rx.customerAddress || 'غير محدد'}</li>
      ${rx.notes ? `<li><strong>ملاحظات المريض:</strong> ${rx.notes}</li>` : ''}
    </ul>
    ${rx.imageUrl ? `<p style="margin-top: 15px;"><a href="${rx.imageUrl}" target="_blank" style="display: inline-block; padding: 10px 18px; background: #7c3aed; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">🔍 فتح ومعاينة صورة الروشتة</a></p>` : ''}
  </div>
</body>
</html>
    `;

    if (!transporter) {
      this.logger.log(`[MOCK EMAIL] Admin prescription alert to: ${adminEmail} | #${rx.id}`);
      return { success: true };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: adminEmail,
        subject: `📋 روشتة طبية جديدة #${rx.id} - ${rx.customerName}`,
        html: htmlContent,
      });
      this.logger.log(`Admin prescription notification email sent to ${adminEmail}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send admin prescription alert email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendTestEmail(targetEmail: string): Promise<{ success: boolean; error?: string }> {

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        error: 'بيانات الـ SMTP غير مكتملة في الإعدادات أو ملف .env',
      };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: targetEmail,
        subject: 'رسالة اختبار من منصة صيدلية د. شيماء',
        html: '<p dir="rtl">تهانينا! خدمة البريد الإلكتروني تعمل بنجاح وبشكل سليم على المنصة.</p>',
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
