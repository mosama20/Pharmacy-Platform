import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, Prescription } from '../database/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly db: DbService) {}

  async findAll(status?: string) {
    let list = [...this.db.prescriptions];
    if (status && status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  async findOne(id: string) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');
    return rx;
  }

  async uploadPrescription(dto: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    governorate?: string;
    district?: string;
    images: string[];
    notes?: string;
    allowAlternatives?: boolean;
    hasInsurance?: boolean;
    insuranceCompany?: string;
    insuranceCardNumber?: string;
  }) {
    if (!dto.images || dto.images.length === 0) {
      throw new BadRequestException('يجب إرفاق صورة واحدة للروشتة على الأقل');
    }

    const newRx: Prescription = {
      id: `rx_${uuidv4().substring(0, 8)}`,
      customerId: dto.customerId || 'guest_user',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerAddress: dto.customerAddress || 'القاهرة',
      governorate: dto.governorate || 'القاهرة',
      district: dto.district || 'المعادي',
      images: dto.images,
      notes: dto.notes || '',
      allowAlternatives: Boolean(dto.allowAlternatives),
      hasInsurance: Boolean(dto.hasInsurance),
      insuranceCompany: dto.insuranceCompany,
      insuranceCardNumber: dto.insuranceCardNumber,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.prescriptions.unshift(newRx);
    this.db.persist();
    return {
      message: 'تم رفع الروشتة بنجاح وجاري مراجعتها بواسطة الصيدلي المناوب فوراً',
      prescription: newRx,
    };
  }

  async quotePrescription(
    id: string,
    pharmacistName: string,
    dto: {
      pharmacistNotes: string;
      quotedItems: Array<{
        productId?: string;
        productName: string;
        quantity: number;
        price: number;
        dosageNote?: string;
      }>;
    },
  ) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');

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
    return {
      message: 'تم تسعير الروشتة وإرسال التسعيرة للعميل بنجاح',
      prescription: rx,
    };
  }

  async updateStatus(
    id: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'ORDER_CREATED',
  ) {
    const rx = this.db.prescriptions.find((p) => p.id === id);
    if (!rx) throw new NotFoundException('الروشتة غير موجودة');
    rx.status = status;
    rx.updatedAt = new Date().toISOString();
    this.db.persist();
    return rx;
  }
}
