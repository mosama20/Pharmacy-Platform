import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  name: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صالحة' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' })
  password: string;

  @IsEnum(['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'], { message: 'نوع الدور الوظيفي غير صالح' })
  role: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT';

  @IsString()
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صالحة' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' })
  password?: string;

  @IsEnum(['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'], { message: 'نوع الدور الوظيفي غير صالح' })
  @IsOptional()
  role?: 'ADMIN' | 'PHARMACIST' | 'DELIVERY' | 'SUPPORT';

  @IsString()
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { message: 'حالة الحساب غير صالحة' })
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
