import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService, User } from '../database/db.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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
    updateDto: UpdateStaffDto,
    currentUser?: any,
  ) {
    if (currentUser && currentUser.id === id) {
      if (updateDto.status && updateDto.status !== 'ACTIVE') {
        throw new BadRequestException('لا يمكنك تعطيل أو إيقاف حسابك الإداري الحالي');
      }
      if (updateDto.role && updateDto.role !== 'ADMIN') {
        throw new BadRequestException('لا يمكنك سحب صلاحيات الإدارة من حسابك الحالي');
      }
    }

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

    // Async sync to PostgreSQL
    await this.db.prisma.user.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.phone && { phone: updateDto.phone }),
        ...(updateDto.role && { role: updateDto.role as any }),
        ...(updateDto.status && { status: updateDto.status as any }),
        ...(updateDto.password && { password: staff.password }),
      },
    }).catch((e) => console.warn('Prisma staff update error:', e));

    const { password, ...safeStaff } = staff;
    return {
      message: 'تم تحديث بيانات الموظف بنجاح',
      staff: safeStaff,
    };
  }

  async deleteStaff(id: string, currentUser?: any) {
    if (currentUser && currentUser.id === id) {
      throw new BadRequestException('لا يمكنك حذف حسابك الإداري الحالي');
    }
    const index = this.db.users.findIndex((u) => u.id === id && u.role !== 'CUSTOMER');
    if (index === -1) {
      throw new NotFoundException('الموظف غير موجود');
    }
    const removed = this.db.users.splice(index, 1)[0];
    this.db.persist();

    // Async soft delete in PostgreSQL
    await this.db.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    }).catch((e) => console.warn('Prisma staff delete error:', e));

    const { password, ...safeStaff } = removed;
    return {
      message: 'تم حذف حساب الموظف بنجاح',
      staff: safeStaff,
    };
  }
}
