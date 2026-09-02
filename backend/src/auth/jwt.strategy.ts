import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DbService } from '../database/db.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DbService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'PHARMACY_PLATFORM_SUPER_SECRET_KEY_2026',
    });
  }

  async validate(payload: any) {
    const user = this.db.users.find((u) => u.id === payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('المستخدم غير مصرح أو الحساب موقوف');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  }
}
