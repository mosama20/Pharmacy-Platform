import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async findAllCustomers(query?: string) {
    let list = this.db.users.filter((u) => u.role === 'CUSTOMER');
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
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
}
