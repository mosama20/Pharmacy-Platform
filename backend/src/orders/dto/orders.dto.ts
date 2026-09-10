import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DeliveryTypeEnum {
  EXPRESS_45M = 'EXPRESS_45M',
  SCHEDULED = 'SCHEDULED',
  MONTHLY_REFILL = 'MONTHLY_REFILL',
}

export enum PaymentMethodEnum {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  CREDIT_CARD = 'CREDIT_CARD',
  FAWRY = 'FAWRY',
  VODAFONE_CASH = 'VODAFONE_CASH',
  VALU = 'VALU',
}

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  governorate: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  apartment?: string;

  @IsString()
  @IsOptional()
  landmark?: string;
}

export class OrderItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  activeIngredient?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsBoolean()
  @IsOptional()
  isPrescriptionRequired?: boolean;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  deliveryAddress?: DeliveryAddressDto;

  @IsOptional()
  address?: any;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @IsEnum(DeliveryTypeEnum)
  @IsOptional()
  deliveryType?: DeliveryTypeEnum;

  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  paymentMethod?: PaymentMethodEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  total?: number;


  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  prescriptionId?: string;

  @IsOptional()
  paymentDetails?: any;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @IsString()
  @IsOptional()
  assignedCourierId?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  lng?: number;
}

export class UpdateCourierLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

