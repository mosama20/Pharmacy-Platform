import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PrescriptionStatusEnum {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  ORDER_CREATED = 'ORDER_CREATED',
}

export class UploadPrescriptionDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsOptional()
  governorate?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  imageBase64?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  patientNotes?: string;

  @IsString()
  @IsOptional()
  customerNotes?: string;

  @IsBoolean()
  @IsOptional()
  allowAlternatives?: boolean;

  @IsBoolean()
  @IsOptional()
  hasInsurance?: boolean;

  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @IsString()
  @IsOptional()
  insuranceCardNumber?: string;

  @IsString()
  @IsOptional()
  insuranceMemberId?: string;

  @IsString()
  @IsOptional()
  insuranceCardPhoto?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @IsString()
  @IsOptional()
  insuranceNumber?: string;

  @IsNumber()
  @IsOptional()
  patientAge?: number;

  @IsOptional()
  requestedItems?: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    price?: number;
    dosageNote?: string;
    image?: string;
  }>;

  @IsOptional()
  deliveryAddress?: any;
}

export class QuotedItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  dosageNote?: string;
}

export class QuotePrescriptionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotedItemDto)
  quotedItems: QuotedItemDto[];

  @IsString()
  @IsOptional()
  pharmacistNotes?: string;
}

export class UpdatePrescriptionStatusDto {
  @IsEnum(PrescriptionStatusEnum)
  status: PrescriptionStatusEnum;

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
