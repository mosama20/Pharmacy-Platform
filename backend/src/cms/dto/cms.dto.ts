import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsEnum,
} from 'class-validator';

// --- Banners ---
export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsString()
  @IsNotEmpty()
  bg: string;

  @IsString()
  @IsNotEmpty()
  accent: string;

  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @IsEnum(['upload', 'refill', 'category', 'link'])
  actionType: 'upload' | 'refill' | 'category' | 'link';

  @IsString()
  @IsOptional()
  actionValue?: string;

  @IsString()
  @IsNotEmpty()
  img: string;

  @IsNumber()
  order: number;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  bg?: string;

  @IsString()
  @IsOptional()
  accent?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsEnum(['upload', 'refill', 'category', 'link'])
  @IsOptional()
  actionType?: 'upload' | 'refill' | 'category' | 'link';

  @IsString()
  @IsOptional()
  actionValue?: string;

  @IsString()
  @IsOptional()
  img?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// --- Categories ---
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  iconName: string;

  @IsBoolean()
  @IsOptional()
  isSpecial?: boolean;

  @IsNumber()
  order: number;

  @IsNumber()
  @IsOptional()
  productCount?: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  iconName?: string;

  @IsBoolean()
  @IsOptional()
  isSpecial?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsNumber()
  @IsOptional()
  productCount?: number;
}

// --- Promo Codes ---
export class ValidatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  cartTotal: number;
}

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsNumber()
  @Min(0)
  minOrderValue: number;

  @IsNumber()
  @Min(0)
  maxDiscount: number;

  @IsString()
  @IsNotEmpty()
  expiresAt: string;

  @IsNumber()
  @Min(1)
  usageLimit: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePromoCodeDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// --- Articles ---
export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  authorRole: string;

  @IsString()
  @IsNotEmpty()
  readTime: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  authorRole?: string;

  @IsString()
  @IsOptional()
  readTime?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

// --- Platform Settings ---
export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  websiteName?: string;

  @IsString()
  @IsOptional()
  websiteSlogan?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryFee?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  freeDeliveryThreshold?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxPercentage?: number;

  @IsBoolean()
  @IsOptional()
  isOnlineStoreActive?: boolean;

  @IsString()
  @IsOptional()
  operatingHours?: string;

  @IsOptional()
  socialLinks?: any;

  @IsOptional()
  navigationMenu?: any;

  @IsOptional()
  footerColumns?: any;
}
