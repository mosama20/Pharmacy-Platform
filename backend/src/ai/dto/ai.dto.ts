import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class AnalyzePrescriptionDto {
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  imageBase64?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckInteractionsDto {
  @IsArray({ message: 'يجب تقديم قائمة من معرفات المنتجات' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  productIds: string[];
}
