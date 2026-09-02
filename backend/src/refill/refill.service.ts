import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService, RefillSubscription } from '../database/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefillService {
  constructor(private readonly db: DbService) {}

  async findAll() {
    return this.db.refills;
  }

  async findByCustomer(customerId: string) {
    return this.db.refills.filter((r) => r.customerId === customerId);
  }

  async create(dto: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    medicationName: string;
    dosageSchedule: string;
    monthlyQuantity: number;
    price: number;
    deliveryAddress: string;
    governorate: string;
    renewalDay: number;
  }) {
    const nextDate = new Date();
    nextDate.setDate(dto.renewalDay || 1);
    if (nextDate <= new Date()) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const newRefill: RefillSubscription = {
      id: `refill_${uuidv4().substring(0, 8)}`,
      customerId: dto.customerId || 'guest_user',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      medicationName: dto.medicationName,
      dosageSchedule: dto.dosageSchedule,
      monthlyQuantity: dto.monthlyQuantity || 1,
      price: dto.price,
      deliveryAddress: dto.deliveryAddress,
      governorate: dto.governorate,
      renewalDay: dto.renewalDay || 1,
      status: 'ACTIVE',
      nextRefillDate: nextDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    this.db.refills.push(newRefill);
    this.db.persist();
    return {
      message: 'تم تفعيل باقة التكرار الشهري للدواء بنجاح وسنقوم بتذكيرك وتوصيلها تلقائياً!',
      refill: newRefill,
    };
  }

  async toggleStatus(id: string) {
    const refill = this.db.refills.find((r) => r.id === id);
    if (!refill) throw new NotFoundException('الاشتراك غير موجود');
    refill.status = refill.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.db.persist();
    return refill;
  }
}
