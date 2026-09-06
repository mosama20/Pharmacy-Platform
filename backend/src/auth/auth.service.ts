import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { DbService } from '../database/db.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly db: DbService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      jti: uuidv4(),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    // Hash and store sha256 refreshTokenHash in database
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  async login(emailOrPhone: string, pass: string) {
    if (!emailOrPhone || !pass) {
      throw new BadRequestException('يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور');
    }

    const term = emailOrPhone.trim().toLowerCase();

    // Query user by email or phone directly from PostgreSQL (no role-based shortcuts allowed!)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: term, mode: 'insensitive' } },
          { phone: term },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة، يرجى التأكد من البريد أو رقم الهاتف');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('هذا الحساب موقوف أو معطل حالياً من قبل إدارة النظام');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Keep db in-memory user list synchronized
    const memUser = this.db.users.find((u) => u.id === user.id);
    if (memUser) {
      memUser.status = user.status as any;
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      points: user.points,
      walletBalance: user.walletBalance,
      city: user.city,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      accessToken,
      access_token: accessToken, // Frontend backward compatibility alias
      refreshToken,
      user: safeUser,
      message: 'تم تسجيل الدخول بنجاح',
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new BadRequestException('رمز التحديث (refresh token) مطلوب');
    }

    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'refresh' || !payload.sub) {
        throw new UnauthorizedException('رمز التحديث غير صالح');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE || !user.refreshTokenHash) {
        throw new UnauthorizedException('الجلسة منتهية أو المستخدم غير صالح');
      }

      // Check if refreshToken matches stored hash
      const incomingHash = this.hashToken(token);
      const isMatch =
        user.refreshTokenHash.length === incomingHash.length &&
        crypto.timingSafeEqual(Buffer.from(user.refreshTokenHash), Buffer.from(incomingHash));

      if (!isMatch) {
        // Potential token reuse / theft: revoke all tokens for this user!
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshTokenHash: null },
        });
        throw new UnauthorizedException('تم اكتشاف جلسة غير مصرح بها، يرجى إعادة تسجيل الدخول');
      }

      // Token rotation: Issue new access token AND new refresh token
      const tokens = await this.generateTokens(user);

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        points: user.points,
        walletBalance: user.walletBalance,
        city: user.city,
        address: user.address,
        createdAt: user.createdAt.toISOString(),
      };

      return {
        accessToken: tokens.accessToken,
        access_token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: safeUser,
      };
    } catch (err) {
      throw new UnauthorizedException('رمز التحديث منتهي الصلاحية أو غير صالح');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'تم تسجيل الخروج بنجاح وإلغاء تنشيط الجلسة' };
  }

  async registerCustomer(dto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
  }) {
    if (!dto.email || !dto.password || !dto.name || !dto.phone) {
      throw new BadRequestException('يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، الهاتف، كلمة المرور)');
    }

    if (dto.password.length < 8) {
      throw new BadRequestException('كلمة المرور يجب ألا تقل عن 8 خانات');
    }

    const emailNorm = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: emailNorm, mode: 'insensitive' } },
          { phone: dto.phone.trim() },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('البريد الإلكتروني أو رقم الهاتف مسجل بالفعل');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userId = `usr_${uuidv4().substring(0, 8)}`;

    const newUser = await this.prisma.user.create({
      data: {
        id: userId,
        name: dto.name.trim(),
        email: emailNorm,
        phone: dto.phone.trim(),
        password: hashedPassword,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        address: dto.address || '',
        city: dto.city || 'القاهرة',
        points: 100, // Welcome bonus points
        walletBalance: 0,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(newUser);

    // Sync in-memory list
    this.db.users.push({
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
    } as any);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      points: newUser.points,
      walletBalance: newUser.walletBalance,
      city: newUser.city,
      address: newUser.address,
      createdAt: newUser.createdAt.toISOString(),
    };

    return {
      accessToken,
      access_token: accessToken,
      refreshToken,
      user: safeUser,
      message: 'تم إنشاء حساب العميل بنجاح وتمت إضافة 100 نقطة ترحيبية!',
    };
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('يرجى إدخال البريد الإلكتروني');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email.trim().toLowerCase(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (!user) {
      // Return generic message to prevent user enumeration
      return {
        message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط استعادة كلمة المرور',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpiresAt: resetExpires,
      },
    });

    return {
      message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط استعادة كلمة المرور',
      // In dev/test environment we return token for verification
      ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
    };
  }

  async resetPassword(token: string, newPass: string) {
    if (!token || !newPass) {
      throw new BadRequestException('رمز الاستعادة وكلمة المرور الجديدة مطلوبان');
    }

    if (newPass.length < 8) {
      throw new BadRequestException('كلمة المرور يجب ألا تقل عن 8 خانات');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('رمز الاستعادة غير صالح أو انتهت صلاحيته');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null, // Revoke active sessions on password change
      },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      points: user.points,
      walletBalance: user.walletBalance,
      city: user.city,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
