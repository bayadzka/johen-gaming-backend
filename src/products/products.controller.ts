// src/products/products.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Menambahkan produk baru (Admin)' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mengambil semua daftar produk (Publik)' })
  findAll() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail produk berdasarkan ID (Publik)' })
  findOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui data produk (Admin)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus produk (Admin)' })
  remove(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}