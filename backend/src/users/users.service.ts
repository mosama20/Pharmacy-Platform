import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, User } from '../database/db.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async findAll(role?: string, status?: string, query?: string) {
    let list = [...this.db.users];
    if (role && role !== 'ALL') {
      list = list.filter((u) => u.role === role);
    }
    if (status && status !== 'ALL') {
      list = list.filter((u) => u.status === status);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.id?.toLowerCase().includes(q),
      );
    }
    return list.map(({ password, ...rest }) => ({
      ...rest,
      totalOrders: this.db.orders.filter((o) => o.customerId === rest.id).length,
      totalSpent: this.db.orders
        .filter((o) => o.customerId === rest.id && o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.total, 0),
    }));
  }

  async findAllCustomers(query?: string) {
    return this.findAll('CUSTOMER', undefined, query);
  }

  async findOne(id: string) {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    user.status = status;
    this.db.persist();
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateRole(id: string, role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT' | 'CUSTOMER') {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    user.role = role;
    this.db.persist();
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async resetPassword(id: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
    }
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    user.password = await bcrypt.hash(newPass, 10);
    this.db.persist();
    return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  async deleteUser(id: string) {
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException('المستخدم غير موجود');
    const [deleted] = this.db.users.splice(index, 1);
    this.db.persist();
    const { password, ...safeUser } = deleted;
    return safeUser;
  }
}

