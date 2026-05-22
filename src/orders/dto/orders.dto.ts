// src/orders/dto/orders.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum OrderType {
  TOPUP = 'topup',
  ACCOUNT = 'account',
}

export class CheckoutDto {
  @ApiProperty({ enum: OrderType, example: OrderType.ACCOUNT })
  @IsEnum(OrderType)
  order_type!: OrderType;

  @ApiProperty({ example: 'uuid-produk', description: 'ID dari tabel topup_packages ATAU account_products' })
  @IsUUID()
  @IsNotEmpty()
  product_ref_id!: string;

  @ApiProperty({ example: 'Customer Name' })
  @IsString()
  @IsNotEmpty()
  customer_name!: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  customer_phone!: string;

  @ApiPropertyOptional({ example: { id: '12345678', server: '2012' }, description: 'Wajib diisi jika order_type adalah topup' })
  @IsOptional()
  game_credentials?: any;

  @ApiPropertyOptional({ example: 'JOHENUNTUNG' })
  @IsString()
  @IsOptional()
  voucher_code?: string;
}