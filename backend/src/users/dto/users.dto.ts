import {
  IsEnum,
  IsString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { message: 'حالة المستخدم غير صالحة' })
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export class UpdateUserRoleDto {
  @IsEnum(['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT', 'CUSTOMER'], { message: 'صلاحية المستخدم غير صالحة' })
  role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT' | 'CUSTOMER';
}

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' })
  password: string;
}
