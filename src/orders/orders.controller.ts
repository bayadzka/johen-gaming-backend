// src/orders/orders.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/orders.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Simulasi alur checkout customer (Publik/User)' })
  async checkout(@Body() checkoutDto: CheckoutDto) {
    // ID MOCK CUSTOMER: Ambil salah satu ID User dari tabel profiles di Supabase kamu untuk testing
    const mockCustomerId = 'd2b178dd-6a8f-4584-b61c-4d80ab370224';
    
    return this.ordersService.checkout(checkoutDto, mockCustomerId);
  }

  @Get()
  @ApiOperation({ summary: 'Melihat semua daftar pesanan masuk (Admin Dashboard)' })
  findAll() {
    return this.ordersService.getAllOrders();
  }
  @Post('webhook')
  @ApiOperation({ summary: 'Endpoint untuk menerima update otomatis dari Midtrans (Webhook)' })
  async midtransWebhook(@Body() payload: any) {
    return this.ordersService.handleMidtransWebhook(payload);
  }
}