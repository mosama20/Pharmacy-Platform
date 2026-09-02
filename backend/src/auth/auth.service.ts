import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService, User } from '../database/db.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwtService: JwtService,
  ) {}

  async login(emailOrPhone: string, pass: string) {
    const user = this.db.users.find(
      (u) =>
        (u.email?.toLowerCase() === emailOrPhone?.toLowerCase() ||
          u.phone === emailOrPhone) &&
        u.status === 'ACTIVE',
    );

    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة أو الحساب معطل');
    }

    const isMatch = await bcrypt.compare(pass, user.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('كلمة المرور غير صحيحة');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const { password, ...safeUser } = user;
    return {
      accessToken: token,
      user: safeUser,
      message: 'تم تسجيل الدخول بنجاح',
    };
  }

  async registerCustomer(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
  }) {
    const existing = this.db.users.find(
      (u) =>
        u.email?.toLowerCase() === dto.email?.toLowerCase() ||
        u.phone === dto.phone,
    );
    if (existing) {
      throw new BadRequestException('البريد الإلكتروني أو رقم الهاتف مسجل بالفعل');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser: User = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: dto.address || '',
      city: dto.city || 'القاهرة',
      points: 100, // Welcome bonus points
      walletBalance: 0,
      createdAt: new Date().toISOString(),
    };

    this.db.users.push(newUser);
    this.db.persist();

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const token = this.jwtService.sign(payload);

    const { password, ...safeUser } = newUser;
    return {
      accessToken: token,
      user: safeUser,
      message: 'تم إنشاء حساب العميل بنجاح وتمت إضافة 100 نقطة ترحيبية!',
    };
  }

  async getProfile(userId: string) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
