// src/products/dto/products.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum ProductCategory {
  GAME_ACCOUNT = 'game_account',
  TOP_UP = 'top_up',
}

enum ProductStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
}

export class CreateProductDto {
  @ApiProperty({ example: 'Akun Mobile Legends Mythic Glory' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Full emblem, skin legend banyak' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.GAME_ACCOUNT })
  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  stock?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Akun Mobile Legends Mythic Glory (Turun Harga)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Full emblem, skin legend banyak. Butuh dana cepat.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 450000 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.AVAILABLE })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}