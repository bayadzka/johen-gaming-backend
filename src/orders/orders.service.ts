// src/orders/orders.service.ts
import * as crypto from 'crypto';
import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CheckoutDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService
  ) {}

  async checkout(checkoutDto: CheckoutDto, customerId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Ambil data produk & pastikan produk tersedia
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', checkoutDto.product_id)
      .single();

    if (pError || !product) throw new NotFoundException('Produk tidak ditemukan');
    if (product.status === 'sold' || product.stock <= 0) {
      throw new BadRequestException('Maaf, produk ini sudah habis terjual');
    }

    // 2. Simulasi Perhitungan Voucher Code
    let totalPrice = product.price;
    if (checkoutDto.voucher_code && checkoutDto.voucher_code.toUpperCase() === 'JOHENUNTUNG') {
      totalPrice = Math.max(0, product.price - 10000); // Potongan Rp 10.000
    }

    // 3. Insert draf pesanan ke database Supabase (Status masih pending)
    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: customerId,
          customer_name: checkoutDto.customer_name,
          customer_phone: checkoutDto.customer_phone,
          product_id: checkoutDto.product_id,
          voucher_code: checkoutDto.voucher_code || null,
          total_price: totalPrice,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (oError || !order) throw new InternalServerErrorException('Gagal membuat data pesanan');

    // 4. Tembak API Midtrans Snap untuk membuat Link Pembayaran
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const midtransPayload = {
      transaction_details: {
        order_id: order.id, // ID Order dari Supabase kita pakai sebagai Order ID Midtrans
        gross_amount: totalPrice,
      },
      item_details: [
        {
          id: product.id,
          price: totalPrice,
          quantity: 1,
          name: product.name,
        },
      ],
      customer_details: {
        first_name: checkoutDto.customer_name,
        phone: checkoutDto.customer_phone,
      },
    };

    try {
      const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authHeader}`,
        },
        body: JSON.stringify(midtransPayload),
      });

      const midtransData = await response.json();

      if (!response.ok) {
        throw new Error(midtransData.message || 'Gagal merespons ke Midtrans');
      }

      // 5. Update data order di Supabase dengan URL Pembayaran dari Midtrans
      const { data: updatedOrder, error: uError } = await supabase
        .from('orders')
        .update({ payment_url: midtransData.redirect_url })
        .eq('id', order.id)
        .select()
        .single();

      if (uError) throw new InternalServerErrorException('Gagal memperbarui link pembayaran');

      // Kembalikan ringkasan pesanan lengkap sesuai requirement dokumen
      return {
        message: 'Checkout sukses, silakan lakukan pembayaran',
        order_summary: {
          order_id: updatedOrder.id,
          product_name: product.name,
          original_price: product.price,
          discount: product.price - totalPrice,
          total_payment: updatedOrder.total_price,
          payment_url: updatedOrder.payment_url,
          status: updatedOrder.payment_status,
        },
      };
    } catch (err: any) {
      throw new InternalServerErrorException(err.message || 'Terjadi kesalahan sistem pembayaran');
    }
  }

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
  
}