import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم المنتج بالعربية مطلوب' })
  nameAr: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsNumber()
  @Min(0, { message: 'السعر يجب أن يكون أكبر من أو يساوي الصفر' })
  price: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsString()
  @IsNotEmpty({ message: 'القسم الرئيسي مطلوب' })
  category: string;

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  activeIngredient?: string;

  @IsString()
  @IsOptional()
  concentration?: string;

  @IsString()
  @IsOptional()
  dosageForm?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isPrescriptionRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isHotDeal?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alternatives?: string[];

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  sideEffects?: string;

  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  reviewCount?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  activeIngredient?: string;

  @IsString()
  @IsOptional()
  concentration?: string;

  @IsString()
  @IsOptional()
  dosageForm?: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  sideEffects?: string;

  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isPrescriptionRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isHotDeal?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alternatives?: string[];

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  ratingCount?: number;

  @IsNumber()
  @IsOptional()
  reviewCount?: number;
}

export class ImportExcelDto {
  @IsString()
  @IsOptional()
  base64?: string;

  @IsString()
  @IsOptional()
  filePath?: string;

  @IsEnum(['replace', 'append'])
  @IsOptional()
  mode?: 'replace' | 'append';
}

export class ImportDefaultDto {
  @IsEnum(['replace', 'append'])
  @IsOptional()
  mode?: 'replace' | 'append';
}
