import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService, RefillSubscription } from '../database/db.service';
import { CreateRefillDto } from './dto/refill.dto';
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

  async create(dto: CreateRefillDto) {
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

    // Async sync to PostgreSQL
    await this.db.prisma.refillSubscription.create({
      data: {
        id: newRefill.id,
        customerId: dto.customerId || null,
        customerName: newRefill.customerName,
        customerPhone: newRefill.customerPhone,
        medicationName: newRefill.medicationName,
        dosageSchedule: newRefill.dosageSchedule,
        monthlyQuantity: Number(newRefill.monthlyQuantity) || 1,
        price: Number(newRefill.price) || 0,
        deliveryAddress: newRefill.deliveryAddress,
        governorate: newRefill.governorate,
        renewalDay: Number(newRefill.renewalDay) || 1,
        status: 'ACTIVE',
        nextRefillDate: nextDate,
      },
    }).catch((e) => console.warn('Prisma refill create error:', e));

    return {
      message: 'تم تفعيل باقة التكرار الشهري للدواء بنجاح وسنقوم بتذكيرك وتوصيلها تلقائياً!',
      refill: newRefill,
    };
  }

  async toggleStatus(id: string, user: any) {
    const refill = this.db.refills.find((r) => r.id === id);
    if (!refill) throw new NotFoundException('الاشتراك غير موجود');

    if (user && user.role !== 'ADMIN' && refill.customerId !== user.id) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الاشتراك');
    }

    refill.status = refill.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.db.persist();

    // Async sync to PostgreSQL
    await this.db.prisma.refillSubscription.update({
      where: { id: refill.id },
      data: { status: refill.status as any },
    }).catch((e) => console.warn('Prisma refill update error:', e));

    return refill;
  }
}
