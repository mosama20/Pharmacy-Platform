import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../database/db.service';

export interface TelegramOrderDetails {
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
  prescriptionId?: string;
}

export interface TelegramPrescriptionDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  governorate?: string;
  district?: string;
  imageUrl?: string;
  images?: string[];
  notes?: string;
  patientNotes?: string;
  allowAlternatives?: boolean;
  hasInsurance?: boolean;
  insuranceCompany?: string;
  insuranceCardNumber?: string;
  insuranceCardPhoto?: string;
  nationalId?: string;
  requestedItems?: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    price?: number;
    dosageNote?: string;
  }>;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly db: DbService) {}

  private getCredentials() {
    const token =
      this.db.settings?.telegramBotToken ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '8816040899:AAHn5t7WDimz6JudP27PccRPlwFuj8aDMHc';
    const chatId =
      this.db.settings?.telegramChatId ||
      process.env.TELEGRAM_CHAT_ID ||
      '8800720269';
    const isEnabled =
      this.db.settings?.telegramNotificationsEnabled ??
      (process.env.TELEGRAM_ENABLED !== 'false');

    return { token, chatId, isEnabled };
  }

  async sendTextMessage(text: string, customToken?: string, customChatId?: string): Promise<{ success: boolean; error?: string }> {
    const { token: defaultToken, chatId: defaultChatId, isEnabled } = this.getCredentials();
    const token = customToken || defaultToken;
    const chatId = customChatId || defaultChatId;

    if (!isEnabled && !customToken) {
      this.logger.log('Telegram notifications are currently disabled.');
      return { success: false, error: 'Telegram notifications are disabled' };
    }

    if (!token || !chatId) {
      this.logger.warn('Telegram token or chat_id is missing.');
      return { success: false, error: 'Telegram credentials missing' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok || !data.ok) {
        this.logger.warn(`Telegram API error: ${data?.description || response.statusText}`);
        return { success: false, error: data?.description || response.statusText };
      }

      this.logger.log(`Telegram message delivered successfully to chat ${chatId}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram message: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendPhoto(
    photoSource: string,
    caption: string,
    customToken?: string,
    customChatId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { token: defaultToken, chatId: defaultChatId, isEnabled } = this.getCredentials();
    const token = customToken || defaultToken;
    const chatId = customChatId || defaultChatId;

    if (!isEnabled && !customToken) {
      return { success: false, error: 'Telegram notifications are disabled' };
    }

    if (!token || !chatId) {
      return { success: false, error: 'Telegram credentials missing' };
    }

    try {
      // If photo is a base64 Data URL (e.g. data:image/jpeg;base64,...)
      if (photoSource.startsWith('data:')) {
        const matches = photoSource.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([buffer], { type: mimeType });

          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append('photo', blob, 'prescription.jpg');
          formData.append('caption', caption);
          formData.append('parse_mode', 'HTML');

          const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });

          const data = (await response.json()) as any;
          if (data.ok) {
            this.logger.log('Telegram photo delivered successfully via FormData');
            return { success: true };
          }
          this.logger.warn(`Telegram sendPhoto failed (${data.description}), falling back to text`);
        }
      } else if (photoSource.startsWith('http://') || photoSource.startsWith('https://')) {
        // Direct image URL
        const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: photoSource,
            caption,
            parse_mode: 'HTML',
          }),
        });

        const data = (await response.json()) as any;
        if (data.ok) {
          return { success: true };
        }
      }

      // Fallback: send as text message with caption
      return this.sendTextMessage(caption, token, chatId);
    } catch (err: any) {
      this.logger.error(`Error sending Telegram photo: ${err.message}, falling back to text`);
      return this.sendTextMessage(caption, token, chatId);
    }
  }

  async sendNewOrderAlert(order: TelegramOrderDetails): Promise<{ success: boolean; error?: string }> {
    const address = order.deliveryAddress;
    const addressStr = [
      address?.governorate,
      address?.city,
      address?.street,
      address?.building ? `عمارة ${address.building}` : null,
      address?.floor ? `الدور ${address.floor}` : null,
      address?.apartment ? `شقة ${address.apartment}` : null,
      address?.landmark ? `علامة مميزة: ${address.landmark}` : null,
    ]
      .filter(Boolean)
      .join('، ');

    const itemsText = order.items
      .map((it, idx) => {
        const name = it.nameAr || it.nameEn || 'دواء/منتج';
        const lineTotal = (it.price * it.quantity).toFixed(2);
        return `  ${idx + 1}. <b>${name}</b> × ${it.quantity} = ${lineTotal} ج.م`;
      })
      .join('\n');

    const paymentLabel =
      order.paymentMethod === 'CASH_ON_DELIVERY'
        ? '💵 الدفع عند الاستلام (COD)'
        : order.paymentMethod === 'CREDIT_CARD'
        ? '💳 بطاقة بنكية / فيزا'
        : order.paymentMethod === 'VODAFONE_CASH'
        ? '📱 فودافون كاش'
        : order.paymentMethod || 'غير محدد';

    const deliveryLabel =
      order.deliveryType === 'EXPRESS_45M'
        ? '⚡ توصيل فوري سريع (30-45 دقيقة)'
        : order.deliveryType === 'SCHEDULED'
        ? '🕒 موعد مجدول'
        : '📦 توصيل عادي';

    const message = `
🚨 <b>طلب دواء جديد في صيدلية د. شيماء!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>#${order.orderNumber}</code>
📅 <b>التاريخ:</b> ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}

👤 <b>بيانات العميل:</b>
• <b>الاسم:</b> ${order.customerName}
• <b>الهاتف:</b> <code>${order.customerPhone}</code>
${order.customerEmail ? `• <b>البريد:</b> ${order.customerEmail}\n` : ''}📍 <b>العنوان:</b> ${addressStr || 'غير محدد'}

🚚 <b>نوع التوصيل:</b> ${deliveryLabel}
💳 <b>طريقة الدفع:</b> ${paymentLabel}

📦 <b>الأدوية والمنتجات المطلوبة:</b>
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💰 <b>الحساب المالي:</b>
• المجموع الفرعي: ${order.subtotal.toFixed(2)} ج.م
• مصاريف الشحن: ${order.deliveryFee.toFixed(2)} ج.م
${order.discount > 0 ? `• الخصم: -${order.discount.toFixed(2)} ج.م\n` : ''}• <b>الإجمالي النهائي المستحق: ${order.total.toFixed(2)} ج.م</b>

${order.notes ? `📝 <b>ملاحظات العميل:</b> <i>${order.notes}</i>\n` : ''}
⚡ <i>يرجى التجهيز والتواصل مع العميل لتأكيد التسليم فوراً.</i>
`.trim();

    return this.sendTextMessage(message);
  }

  async sendNewPrescriptionAlert(rx: TelegramPrescriptionDetails): Promise<{ success: boolean; error?: string }> {
    const isInsurance = Boolean(rx.hasInsurance);
    const requestedItemsList = (rx.requestedItems && rx.requestedItems.length > 0)
      ? rx.requestedItems.map((it, idx) => `  ${idx + 1}. <b>${it.productName}</b> (الكمية: ${it.quantity}${it.dosageNote ? ` - جرعة: ${it.dosageNote}` : ''})`).join('\n')
      : '';

    const caption = `
${isInsurance ? '🏥 <b>طلب تعاقد وتأمين صحي جديد وارد!</b>' : '📋 <b>روشتة طبية جديدة واردة للمراجعة!</b>'}
━━━━━━━━━━━━━━━━━━━━
🆔 <b>كود الطلب:</b> <code>#${rx.id}</code>
📅 <b>الوقت:</b> ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}

👤 <b>بيانات المريض:</b>
• <b>الاسم:</b> ${rx.customerName}
• <b>الهاتف:</b> <code>${rx.customerPhone}</code>
• <b>المنطقة:</b> ${[rx.district, rx.governorate, rx.customerAddress].filter(Boolean).join(' - ')}
${rx.nationalId ? `• <b>الرقم القومي:</b> <code>${rx.nationalId}</code>\n` : ''}
${isInsurance ? `
💳 <b>بيانات التعاقد والتأمين:</b>
• <b>الجهة / الشركة:</b> ${rx.insuranceCompany || 'غير محدد'}
• <b>رقم الكارت / العضوية:</b> <code>${rx.insuranceCardNumber || 'غير محدد'}</code>
` : ''}
💊 <b>تفاصيل الأدوية والروشتة:</b>
• <b>قبول البدائل المتطابقة:</b> ${rx.allowAlternatives ? '✅ نعم يوافق على البدائل' : '❌ لا، الالتزام بالاسم التجاري'}
${requestedItemsList ? `\n📦 <b>الأدوية المحددة بالاسم:</b>\n${requestedItemsList}\n` : ''}
${rx.notes || rx.patientNotes ? `📝 <b>ملاحظات المريض:</b>\n<i>${rx.notes || rx.patientNotes}</i>\n` : ''}
━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ <i>يرجى الفحص والمراجعة من لوحة التحكم فوراً.</i>
`.trim();

    const imageToSend = rx.imageUrl || (rx.images && rx.images[0]) || rx.insuranceCardPhoto;
    if (imageToSend) {
      return this.sendPhoto(imageToSend, caption);
    }

    return this.sendTextMessage(caption);
  }

  async checkBotStatus(): Promise<any> {
    const { token } = this.getCredentials();
    if (!token) return { ok: false, error: 'No token configured' };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async getLatestUpdates(): Promise<any> {
    const { token } = this.getCredentials();
    if (!token) return { ok: false, error: 'No token configured' };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}
