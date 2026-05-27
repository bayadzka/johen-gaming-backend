import { Controller, Post, Body, Get, Param, Patch, BadRequestException, } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/orders.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Simulasi alur checkout customer (Publik/User)' })
  async checkout(@Body() checkoutDto: CheckoutDto) {
    const mockCustomerId = 'd2b178dd-6a8f-4584-b61c-4d80ab370224';
    return this.ordersService.checkout(checkoutDto, mockCustomerId);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua daftar pesanan' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil rincian pesanan/invoice spesifik' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Endpoint khusus menerima webhook Midtrans' })
  @ApiBody({
    description: 'Payload webhook dari Midtrans',
    schema: {
      type: 'object',
      example: {
        order_id: "MASUKKAN_ID_INVOICE_KAMU_DISINI",
        transaction_status: "settlement",
        fraud_status: "accept"
      }
    }
  })
  handleWebhook(@Body() payload: any) {
    return this.ordersService.handleMidtransWebhook(payload);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Ubah status pesanan secara manual (Admin)' })
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string, @Body('reason') reason?: string) {
    return this.ordersService.updateOrderStatus(id, status, reason);
  }
  @Post(':id/deliver')
  async deliverAccount(
    @Param('id') id: string,
    @Body('game_email') gameEmail: string,
    @Body('game_password') gamePassword: string,
  ) {
    if (!gameEmail || !gamePassword) {
      throw new BadRequestException('Email dan Password game harus diisi!');
    }
    return this.ordersService.deliverAccountData(id, gameEmail, gamePassword);
  }
}