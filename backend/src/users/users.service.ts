import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, User } from '../database/db.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DbService,
    private readonly audit: AuditService,
  ) {}

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

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    currentUser?: any,
  ) {
    if (currentUser && currentUser.id === id && status !== 'ACTIVE') {
      throw new BadRequestException('لا يمكنك تعطيل أو إيقاف حسابك الإداري الحالي');
    }
    const user = this.db.users.find((u) => u.id === id);
    const oldStatus = user.status;
    user.status = status;
    this.db.persist();

    await this.audit.log({
      action: 'USER_STATUS_UPDATE',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      entity: 'User',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status },
    });

    await this.db.prisma.user.update({
      where: { id },
      data: { status: status as any },
    }).catch((e) => console.warn('Prisma user updateStatus error:', e));

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateRole(
    id: string,
    role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT' | 'CUSTOMER',
    currentUser?: any,
  ) {
    if (currentUser && currentUser.id === id && role !== 'ADMIN') {
      throw new BadRequestException('لا يمكنك سحب صلاحيات الإدارة من حسابك الحالي');
    }
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const oldRole = user.role;
    user.role = role;
    this.db.persist();

    await this.audit.log({
      action: 'USER_ROLE_UPDATE',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      entity: 'User',
      entityId: id,
      oldValue: { role: oldRole },
      newValue: { role },
    });

    await this.db.prisma.user.update({
      where: { id },
      data: { role: role as any },
    }).catch((e) => console.warn('Prisma user updateRole error:', e));

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async resetPassword(id: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
    }
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const hashedPassword = await bcrypt.hash(newPass, 10);
    user.password = hashedPassword;
    this.db.persist();

    await this.db.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    }).catch((e) => console.warn('Prisma user resetPassword error:', e));

    return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  async deleteUser(id: string, currentUser?: any) {
    if (currentUser && currentUser.id === id) {
      throw new BadRequestException('لا يمكنك حذف حسابك الإداري الحالي');
    }
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException('المستخدم غير موجود');
    const [deleted] = this.db.users.splice(index, 1);
    this.db.persist();

    await this.audit.log({
      action: 'USER_DELETE',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userRole: currentUser?.role,
      entity: 'User',
      entityId: id,
      oldValue: { name: deleted.name, email: deleted.email, role: deleted.role },
    });

    await this.db.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    }).catch((e) => console.warn('Prisma user delete error:', e));

    const { password, ...safeUser } = deleted;
    return safeUser;
  }
}

