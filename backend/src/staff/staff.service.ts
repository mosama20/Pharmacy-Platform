import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService, User } from '../database/db.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStaffDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT';
  shift?: string;
  nationalId?: string;
  city?: string;
}

@Injectable()
export class StaffService {
  constructor(private readonly db: DbService) {}

  async findAllStaff(role?: string) {
    let staff = this.db.users.filter((u) => u.role !== 'CUSTOMER');
    if (role && role !== 'ALL') {
      staff = staff.filter((u) => u.role === role);
    }
    return staff.map(({ password, ...rest }) => rest);
  }

  async createStaff(dto: CreateStaffDto) {
    const existing = this.db.users.find(
      (u) =>
        u.email.toLowerCase() === dto.email.toLowerCase() ||
        u.phone === dto.phone,
    );
    if (existing) {
      throw new BadRequestException('البريد الإلكتروني أو رقم الهاتف مستخدم لموظف آخر');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newStaff: User = {
      id: `usr_staff_${uuidv4().substring(0, 8)}`,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: dto.role,
      status: 'ACTIVE',
      shift: dto.shift || 'صباحي (9 ص - 5 م)',
      nationalId: dto.nationalId || '',
      city: dto.city || 'القاهرة',
      createdAt: new Date().toISOString(),
    };

    this.db.users.push(newStaff);
    this.db.persist();
    const { password, ...safeStaff } = newStaff;
    return {
      message: 'تم إنشاء حساب الموظف وتحديد صلاحياته بنجاح',
      staff: safeStaff,
    };
  }

  async updateStaff(
    id: string,
    updateDto: Partial<CreateStaffDto> & { status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' },
  ) {
    const staff = this.db.users.find((u) => u.id === id && u.role !== 'CUSTOMER');
    if (!staff) {
      throw new NotFoundException('حساب الموظف غير موجود');
    }

    if (updateDto.name) staff.name = updateDto.name;
    if (updateDto.phone) staff.phone = updateDto.phone;
    if (updateDto.role) staff.role = updateDto.role;
    if (updateDto.shift) staff.shift = updateDto.shift;
    if (updateDto.city) staff.city = updateDto.city;
    if (updateDto.status) staff.status = updateDto.status;
    if (updateDto.password) {
      staff.password = await bcrypt.hash(updateDto.password, 10);
    }
    this.db.persist();

    const { password, ...safeStaff } = staff;
    return {
      message: 'تم تحديث بيانات الموظف بنجاح',
      staff: safeStaff,
    };
  }

  async deleteStaff(id: string) {
    const index = this.db.users.findIndex((u) => u.id === id && u.role !== 'CUSTOMER');
    if (index === -1) {
      throw new NotFoundException('الموظف غير موجود');
    }
    const removed = this.db.users.splice(index, 1)[0];
    this.db.persist();
    const { password, ...safeStaff } = removed;
    return {
      message: 'تم حذف حساب الموظف بنجاح',
      staff: safeStaff,
    };
  }
}
