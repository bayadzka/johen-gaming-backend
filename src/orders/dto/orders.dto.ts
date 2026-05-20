// src/orders/dto/orders.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID produk yang dibeli' })
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @ApiProperty({ example: 'Muhammad Bayu', description: 'Nama lengkap pembeli' })
  @IsString()
  @IsNotEmpty()
  customer_name!: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon aktif pembeli' })
  @IsString()
  @IsNotEmpty()
  customer_phone!: string;

  @ApiPropertyOptional({ example: 'JOHENUNTUNG', description: 'Kode voucher diskon' })
  @IsString()
  @IsOptional()
  voucher_code?: string;
}