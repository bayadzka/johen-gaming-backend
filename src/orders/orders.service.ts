// src/orders/orders.service.ts
import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CheckoutDto } from './dto/orders.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService
  ) {}

  async checkout(checkoutDto: CheckoutDto, customerId: string | null = null) {
    const supabase = this.supabaseService.getClient();
    let productName = '';
    let productPrice = 0;

    // 1. Pengecekan Dinamis berdasarkan Tipe Order
    if (checkoutDto.order_type === 'account') {
      const { data, error } = await supabase
        .from('account_products')
        .select('*')
        .eq('id', checkoutDto.product_ref_id)
        .single();
        
      if (error || !data) throw new NotFoundException('Akun tidak ditemukan');
      if (data.status !== 'available') throw new BadRequestException('Akun ini sudah terjual');
      
      productName = data.title;
      productPrice = data.final_price;

    } else if (checkoutDto.order_type === 'topup') {
      if (!checkoutDto.game_credentials) {
        throw new BadRequestException('Data ID & Server Game wajib diisi untuk Top Up');
      }
      const { data, error } = await supabase
        .from('topup_packages')
        .select('*')
        .eq('id', checkoutDto.product_ref_id)
        .single();
        
      if (error || !data) throw new NotFoundException('Paket Top Up tidak ditemukan');
      
      productName = data.name;
      productPrice = data.price;
    }

    // 2. Simulasi Voucher
    let totalPrice = productPrice;
    if (checkoutDto.voucher_code?.toUpperCase() === 'JOHENUNTUNG') {
      totalPrice = Math.max(0, productPrice - 10000);
    }

    // 3. Insert ke Tabel Orders Baru
    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        customer_name: checkoutDto.customer_name,
        customer_phone: checkoutDto.customer_phone,
        order_type: checkoutDto.order_type,
        product_ref_id: checkoutDto.product_ref_id,
        game_credentials: checkoutDto.game_credentials,
        voucher_code: checkoutDto.voucher_code || null,
        total_amount: totalPrice,
        payment_status: 'pending',
      }])
      .select()
      .single();

    if (oError || !order) throw new InternalServerErrorException('Gagal membuat pesanan');

    // 4. Hit Midtrans Snap
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const midtransPayload = {
      transaction_details: { order_id: order.id, gross_amount: totalPrice },
      item_details: [{ id: checkoutDto.product_ref_id, price: totalPrice, quantity: 1, name: productName.substring(0, 50) }],
      customer_details: { first_name: checkoutDto.customer_name, phone: checkoutDto.customer_phone },
    };

    try {
      const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Basic ${authHeader}` },
        body: JSON.stringify(midtransPayload),
      });

      const midtransData = await response.json();
      if (!response.ok) throw new Error(midtransData.message);

      // Update payment_url di database
      await supabase.from('orders')
        .update({ 
          payment_url: midtransData.redirect_url,
          snap_token: midtransData.token
        })
        .eq('id', order.id);

      return {
        message: 'Checkout sukses',
        order_summary: {
          order_id: order.id,
          product_name: productName,
          total_payment: totalPrice,
          snap_token: midtransData.token,
          status: 'pending',
        },
      };
    } catch (err: any) {
      throw new InternalServerErrorException(err.message || 'Error dari Midtrans');
    }
  }

  // ... (Fungsi getAllOrders dan handleMidtransWebhook biarkan sama persis seperti sebelumnya) ...

  // Menampilkan semua order untuk Dashboard Admin
  async getAllOrders() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }
  // Webhook untuk menerima update status dari Midtrans
  async handleMidtransWebhook(payload: any) {
    const { order_id, transaction_status, fraud_status, signature_key, status_code, gross_amount } = payload;

    // 1. Verifikasi Keamanan (Signature Key)
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    
    // Hash rumus: SHA512(order_id + status_code + gross_amount + serverKey)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex');

    if (expectedSignature !== signature_key) {
      throw new BadRequestException('Signature Key tidak valid! Akses ditolak.');
    }

    // 2. Mapping Status Midtrans ke Status Database Kita
    let paymentStatus = 'pending';
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept') {
        paymentStatus = 'success';
      }
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      paymentStatus = 'failed';
    }

    // 3. Update Status di Supabase
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', order_id);

    if (error) {
      throw new InternalServerErrorException('Gagal memperbarui status pesanan');
    }

    return { message: 'Webhook berhasil diproses, status pesanan diperbarui' };
  }
  async getOrderById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Pesanan tidak ditemukan');
    return { data };
  }
}