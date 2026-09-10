import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class RefillItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class CreateRefillDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsArray()
  @IsOptional()
  items?: RefillItemDto[];

  @IsString()
  @IsOptional()
  medicationName?: string;

  @IsString()
  @IsOptional()
  dosageSchedule?: string;

  @IsNumber()
  @IsOptional()
  monthlyQuantity?: number;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  governorate: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  renewalDay?: number;

  @IsString()
  @IsOptional()
  prescriptionUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
