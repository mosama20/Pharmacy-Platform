import { Injectable, Logger } from '@nestjs/common';
import { TelegramService, TelegramOrderDetails, TelegramPrescriptionDetails } from './telegram.service';
import { EmailService, EmailOrderDetails } from './email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {}

  async notifyNewOrder(order: any) {
    this.logger.log(`Dispatching notifications for new order: #${order.orderNumber}`);

    const telegramPayload: TelegramOrderDetails = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      deliveryAddress: order.deliveryAddress || {},
      deliveryType: order.deliveryType,
      paymentMethod: order.paymentMethod,
      items: (order.items || []).map((it: any) => ({
        nameAr: it.nameAr || it.productName,
        nameEn: it.nameEn,
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
      subtotal: Number(order.subtotal || 0),
      deliveryFee: Number(order.deliveryFee || 0),
      discount: Number(order.discount || 0),
      total: Number(order.total || 0),
      notes: order.notes,
      prescriptionId: order.prescriptionId,
    };

    const emailPayload: EmailOrderDetails = {
      ...telegramPayload,
    };

    // Execute in background so order creation is never delayed or blocked
    Promise.allSettled([
      this.telegramService.sendNewOrderAlert(telegramPayload),
      order.customerEmail ? this.emailService.sendOrderConfirmationEmail(emailPayload) : Promise.resolve(),
    ]).then((results) => {
      this.logger.log(`Notifications result for order #${order.orderNumber}: ${JSON.stringify(results)}`);
    });
  }

  async notifyNewPrescription(prescription: any) {
    this.logger.log(`Dispatching notifications for prescription: #${prescription.id}`);

    const telegramPayload: TelegramPrescriptionDetails = {
      id: prescription.id,
      customerName: prescription.customerName,
      customerPhone: prescription.customerPhone,
      customerAddress: prescription.customerAddress,
      governorate: prescription.governorate,
      district: prescription.district,
      imageUrl: prescription.imageUrl,
      images: prescription.images,
      notes: prescription.notes,
      patientNotes: prescription.patientNotes,
      allowAlternatives: prescription.allowAlternatives,
      hasInsurance: prescription.hasInsurance,
      insuranceCompany: prescription.insuranceCompany,
      insuranceCardNumber: prescription.insuranceCardNumber,
      insuranceCardPhoto: prescription.insuranceCardPhoto,
      nationalId: prescription.nationalId,
      requestedItems: prescription.requestedItems,
    };

    Promise.allSettled([
      this.telegramService.sendNewPrescriptionAlert(telegramPayload),
      prescription.customerEmail
        ? this.emailService.sendPrescriptionConfirmationEmail({
            id: prescription.id,
            customerName: prescription.customerName,
            customerEmail: prescription.customerEmail,
            notes: prescription.notes,
          })
        : Promise.resolve(),
    ]).then((results) => {
      this.logger.log(`Prescription notification results: ${JSON.stringify(results)}`);
    });
  }

  async testTelegram(token?: string, chatId?: string) {
    return this.telegramService.sendTextMessage(
      '🎉 <b>اختبار ناجح!</b> تم توصيل نظام إشعارات صيدلية د. شيماء بنجاح بالتليجرام.',
      token,
      chatId,
    );
  }

  async testEmail(email: string) {
    return this.emailService.sendTestEmail(email);
  }

  async getTelegramBotStatus() {
    return this.telegramService.checkBotStatus();
  }

  async getTelegramUpdates() {
    return this.telegramService.getLatestUpdates();
  }
}
