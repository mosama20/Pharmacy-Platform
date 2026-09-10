import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DbService, Prescription } from '../database/db.service';
import {
  UploadPrescriptionDto,
  QuotePrescriptionDto,
} from './dto/prescriptions.dto';
import { v4 as uuidv4 } from 'uuid';
import { validateUploadedImage } from '../common/file-validator.util';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['QUOTED', 'REJECTED', 'CANCELLED', 'PENDING'],
  QUOTED: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'UNDER_REVIEW'],
  ACCEPTED: ['ORDER_CREATED', 'REJECTED', 'CANCELLED', 'QUOTED'],
  REJECTED: ['PENDING', 'UNDER_REVIEW', 'CANCELLED'],
  CANCELLED: ['PENDING', 'UNDER_REVIEW', 'QUOTED'],
  ORDER_CREATED: [],
};

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly db: DbService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(status?: string) {
    let list = [...this.db.prescriptions];
    if (status && status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findByCustomer(customerId: string) {
    return this.db.prescriptions
      .filter((p) => p.customerId === customerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async findOne(id: string, user?: any) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');

    if (user) {
      const isStaff =
        user.role === 'ADMIN' ||
        user.role === 'PHARMACIST' ||
        user.role === 'SUPPORT';
      const isOwner = rx.customerId === user.id;
      if (!isStaff && !isOwner) {
        throw new ForbiddenException('ليس لديك صلاحية لعرض هذه الروشتة الطبية');
      }
    }

    return rx;
  }

  async uploadPrescription(dto: UploadPrescriptionDto) {
    const rawImages: string[] = [];
    if (Array.isArray(dto.images) && dto.images.length > 0) {
      rawImages.push(...dto.images.filter(Boolean));
    }
    if (dto.imageUrl && !rawImages.includes(dto.imageUrl)) {
      rawImages.unshift(dto.imageUrl);
    }
    if (dto.imageBase64 && !rawImages.includes(dto.imageBase64)) {
      rawImages.unshift(dto.imageBase64);
    }
    if (dto.insuranceCardPhoto && !rawImages.includes(dto.insuranceCardPhoto)) {
      rawImages.push(dto.insuranceCardPhoto);
    }

    if (rawImages.length === 0 && (!dto.requestedItems || dto.requestedItems.length === 0)) {
      throw new BadRequestException('يجب إرفاق صورة للروشتة أو اختيار صنف دواء واحد على الأقل');
    }

    if (rawImages.length > 5) {
      throw new BadRequestException('الحد الأقصى للصور في الروشتة الواحدة هو 5 صور');
    }

    // Validate every attached image (magic bytes, MIME type, max size, SSRF)
    for (const img of rawImages) {
      validateUploadedImage(img);
    }

    const primaryImageUrl = rawImages[0] || dto.insuranceCardPhoto || '';
    const patientNotes = dto.patientNotes || dto.notes || dto.customerNotes || '';

    const newRx: Prescription = {
      id: `rx_${uuidv4().substring(0, 8)}`,
      customerId: dto.customerId || 'guest_user',
      customerName: dto.customerName || 'عميل مجهول',
      customerPhone: dto.customerPhone || '01000000000',
      customerEmail: dto.customerEmail,
      customerAddress: dto.customerAddress || 'القاهرة',
      governorate: dto.governorate || 'القاهرة',
      district: dto.district || 'المعادي',
      images: rawImages,
      imageUrl: primaryImageUrl,
      notes: patientNotes,
      patientNotes: patientNotes,
      allowAlternatives: Boolean(dto.allowAlternatives),
      hasInsurance: Boolean(dto.hasInsurance || dto.insuranceCompany),
      insuranceCompany: dto.insuranceCompany || dto.insuranceProvider,
      insuranceCardNumber: dto.insuranceCardNumber || dto.insuranceMemberId || dto.insuranceNumber,
      insuranceCardPhoto: dto.insuranceCardPhoto,
      nationalId: dto.nationalId,
      requestedItems: dto.requestedItems || [],
      quotedItems: (dto.requestedItems && dto.requestedItems.length > 0)
        ? dto.requestedItems.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
            dosageNote: it.dosageNote || '',
          }))
        : undefined,
      totalQuote: (dto.requestedItems && dto.requestedItems.length > 0)
        ? dto.requestedItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
        : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.prescriptions.unshift(newRx);
    this.db.persist();

    // Async sync to PostgreSQL if available
    this.db.prisma.prescription.create({
      data: {
        id: newRx.id,
        customerId: this.db.users.some((u) => u.id === newRx.customerId) ? newRx.customerId : null,
        customerName: newRx.customerName,
        customerPhone: newRx.customerPhone,
        customerAddress: newRx.customerAddress,
        governorate: newRx.governorate,
        district: newRx.district,
        images: newRx.images,
        imageUrl: newRx.imageUrl,
        notes: newRx.notes,
        patientNotes: newRx.patientNotes,
        allowAlternatives: newRx.allowAlternatives,
        hasInsurance: newRx.hasInsurance,
        insuranceCompany: newRx.insuranceCompany || null,
        insuranceCardNumber: newRx.insuranceCardNumber || null,
        status: newRx.status as any,
      },
    }).catch((e) => console.warn('Prisma create prescription sync warning:', e.message));

    // Dispatch Telegram & Email notifications asynchronously
    this.notificationsService.notifyNewPrescription(newRx);

    return {
      message: 'تم رفع الروشتة بنجاح وجاري مراجعتها بواسطة الصيدلي المناوب فوراً',
      prescription: newRx,
    };
  }

  async quotePrescription(
    id: string,
    pharmacistName: string,
    dto: QuotePrescriptionDto,
  ) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');

    // Only allow quoting for PENDING or UNDER_REVIEW prescriptions
    if (rx.status !== 'PENDING' && rx.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `لا يمكن تسعير روشتة في حالة "${rx.status}". التسعير متاح فقط للروشتات قيد المراجعة والانتظار.`,
      );
    }

    if (!dto.quotedItems || dto.quotedItems.length === 0) {
      throw new BadRequestException('يجب إضافة صنف دوائي واحد على الأقل لتسعير الروشتة');
    }

    const totalQuote = dto.quotedItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    rx.status = 'QUOTED';
    rx.pharmacistNotes = dto.pharmacistNotes;
    rx.reviewedBy = pharmacistName;
    rx.quotedItems = dto.quotedItems;
    rx.totalQuote = totalQuote;
    rx.updatedAt = new Date().toISOString();

    this.db.persist();

    // Async sync to PostgreSQL
    this.db.prisma.prescription.update({
      where: { id: rx.id },
      data: {
        status: 'QUOTED',
        reviewedBy: pharmacistName,
        pharmacistNotes: dto.pharmacistNotes || null,
        totalQuote: totalQuote,
        quotedItems: dto.quotedItems as any,
      },
    }).catch((e) => console.warn('Prisma quote prescription sync warning:', e.message));

    return {
      message: 'تم تسعير الروشتة وإرسال التسعيرة للعميل بنجاح',
      prescription: rx,
    };
  }

  async updateStatus(
    id: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ORDER_CREATED',
    user?: any,
    cancellationReason?: string,
  ) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');

    const isStaff = user && (user.role === 'ADMIN' || user.role === 'PHARMACIST');

    // Check state machine validity
    const allowedTransitions = VALID_TRANSITIONS[rx.status] || [];
    if (!isStaff && !allowedTransitions.includes(status)) {
      throw new BadRequestException(
        `لا يمكن تحويل حالة الروشتة من "${rx.status}" إلى "${status}". التحويلات المسموحة هي: ${allowedTransitions.join(', ') || 'لا يوجد'}`,
      );
    }

    if (user) {
      if (user.role === 'CUSTOMER') {
        if (rx.customerId !== user.id) {
          throw new ForbiddenException('ليس لديك صلاحية لتعديل هذه الروشتة');
        }
        if (!['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(status) || rx.status !== 'QUOTED') {
          throw new ForbiddenException('العميل مصرح له فقط بقبول أو إلغاء الروشتة المسعرة');
        }
      } else if (!isStaff) {
        throw new ForbiddenException('غير مصرح لك بتحديث حالة الروشتة');
      }
    }

    rx.status = status;
    if (cancellationReason !== undefined) {
      rx.cancellationReason = cancellationReason;
    }

    // Deduct stock if prescription reaches ORDER_CREATED
    if (status === 'ORDER_CREATED' && Array.isArray(rx.quotedItems)) {
      for (const item of rx.quotedItems) {
        if (item.productId) {
          const product = this.db.products.find((p) => p.id === item.productId);
          if (product && product.stock !== undefined) {
            product.stock = Math.max(0, product.stock - (Number(item.quantity) || 1));
            this.db.prisma.product
              .update({
                where: { id: product.id },
                data: { stock: product.stock },
              })
              .catch((e) => console.warn('Prisma product stock deduction warning:', e.message));
          }
        }
      }
    }

    rx.updatedAt = new Date().toISOString();
    this.db.persist();

    // Async sync to PostgreSQL
    await this.db.prisma.prescription
      .update({
        where: { id: rx.id },
        data: {
          status: rx.status as any,
          cancellationReason: rx.cancellationReason || null,
        },
      })
      .catch((e) => console.warn('Prisma rx status update error:', e));

    return rx;
  }
}
