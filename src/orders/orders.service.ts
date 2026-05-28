// src/orders/orders.service.ts
import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CheckoutDto } from './dto/orders.dto';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService
  ) { }

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
    let totalPrice = checkoutDto.total_amount ? Number(checkoutDto.total_amount) : productPrice;

    // 3. Insert ke Tabel Orders Baru
    const { data: order, error: oError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        customer_name: checkoutDto.customer_name,
        customer_phone: checkoutDto.customer_phone,
        customer_email: checkoutDto.customer_email || null,
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

  async getOrderById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Pesanan tidak ditemukan');
    return { data };
  }

  // 1. Ambil SEMUA Riwayat Pesanan (Untuk halaman riwayat transaksi)
  async getAllOrders() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  // Update status pesanan secara manual (Untuk Admin) dengan alasan
  async updateOrderStatus(id: string, status: string, reason?: string) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = { payment_status: status };
    if (reason) updateData.cancel_reason = reason;

    console.log(`[MANUAL UPDATE] Memproses order ${id} menjadi ${status}...`);

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("[MANUAL ERROR] Gagal update orders:", error);
      throw new InternalServerErrorException('Gagal merubah status pesanan');
    }

    console.log(`[MANUAL] Tipe order: ${order.order_type}, Product ID: ${order.product_ref_id}`);

    // --- LOGIKA OTOMATIS: UBAH STATUS AKUN JADI TERJUAL ---
    if (status === 'success' && order.order_type === 'account') {
      console.log(`[MANUAL] Mengeksekusi update status akun ${order.product_ref_id} menjadi 'sold'...`);
      const { data: accData, error: accError } = await supabase
        .from('account_products')
        .update({ status: 'sold' })
        .eq('id', order.product_ref_id)
        .select();

      if (accError) {
        console.error("[MANUAL ERROR] Gagal merubah status akun di Supabase:", accError);
      } else {
        console.log("[MANUAL SUCCESS] Status akun berhasil diubah:", accData);
      }
    }

    return { message: 'Status berhasil diubah', data: order };
  }

  // Fungsi Penerima Sinyal Webhook dari Midtrans
  async handleMidtransWebhook(payload: any) {
    const supabase = this.supabaseService.getClient();
    const { order_id, transaction_status, fraud_status } = payload;

    let status = 'pending';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) status = 'success';
    } else if (transaction_status === 'expire') {
      status = 'expired';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      status = 'failed';
    }

    console.log(`[WEBHOOK] Menerima status ${status} untuk order ${order_id}`);

    const { data: order, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error("[WEBHOOK ERROR] Gagal update orders:", error);
      throw new InternalServerErrorException("Database update error");
    }

    console.log(`[WEBHOOK] Tipe order: ${order.order_type}, Product ID: ${order.product_ref_id}`);

    // --- LOGIKA OTOMATIS: UBAH STATUS AKUN JADI TERJUAL ---
    if (status === 'success' && order.order_type === 'account') {
      console.log(`[WEBHOOK] Mengeksekusi update status akun ${order.product_ref_id} menjadi 'sold'...`);
      const { data: accData, error: accError } = await supabase
        .from('account_products')
        .update({ status: 'sold' })
        .eq('id', order.product_ref_id)
        .select();

      if (accError) {
        console.error("[WEBHOOK ERROR] Gagal merubah status akun di Supabase:", accError);
      } else {
        console.log("[WEBHOOK SUCCESS] Status akun berhasil diubah:", accData);
      }
    }

    return { message: 'Webhook sukses dieksekusi', status_terkini: status };
  }

  async deliverAccountData(orderId: string, gameEmail: string, gamePass: string) {
    const supabase = this.supabaseService.getClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new NotFoundException('Pesanan tidak ditemukan');

    const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: this.configService.get<string>('EMAIL_USER'),
    pass: this.configService.get<string>('EMAIL_PASS'),
  },
  tls: {
    rejectUnauthorized: false,
  }
});

    const htmlTemplate = `
      <div style="background-color:#05050D; padding:40px; font-family:sans-serif; color:#ffffff;">
        <div style="max-width:600px; margin:0 auto; background-color:#12122A; border:1px solid #22D3EE; border-radius:16px; overflow:hidden;">
          <div style="background-color:#0A0A1A; padding:20px; text-align:center; border-bottom:1px solid #333;">
            <h2 style="color:#22D3EE; margin:0; letter-spacing:2px; font-weight:900;">JOHEN GAMING</h2>
          </div>
          <div style="padding:30px;">
            <h3 style="color:#ffffff;">Pesanan Selesai! 🎉</h3>
            <p style="color:#a1a1aa; font-size:14px;">Halo <strong>${order.customer_name}</strong>, terima kasih telah berbelanja. Berikut adalah detail akun game yang baru saja kamu beli:</p>
            
            <div style="background-color:#05050D; padding:20px; border-radius:8px; border-left:4px solid #22D3EE; margin:20px 0;">
              <p style="margin:0 0 10px 0;"><span style="color:#a1a1aa; font-size:12px;">EMAIL / USERNAME GAME</span><br/><strong style="font-size:16px; color:#ffffff;">${gameEmail}</strong></p>
              <p style="margin:0;"><span style="color:#a1a1aa; font-size:12px;">PASSWORD GAME</span><br/><strong style="font-size:16px; color:#ffffff;">${gamePass}</strong></p>
            </div>
            
            <p style="color:#ef4444; font-size:12px; font-weight:bold;">*PENTING: Segera login ke dalam game, ubah password di atas, dan tautkan ke email pribadi kamu demi keamanan!</p>
          </div>
        </div>
      </div>
    `;

    const targetEmail = order.customer_email;

    if (!targetEmail) {
      throw new BadRequestException('Email pembeli tidak ditemukan di data pesanan ini.');
    }

    try {
      await transporter.sendMail({
        from: '"Johen Gaming" <noreply@johengaming.com>',
        to: targetEmail,
        subject: 'Detail Akun Game Kamu! - Johen Gaming',
        html: htmlTemplate,
      });

      // PERBAIKAN: Memaksa eksekusi update status dengan .select().single()
      // PERBAIKAN: Memaksa eksekusi update status dengan kata yang diizinkan database ('completed')
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ payment_status: 'completed' })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error("GAGAL UPDATE STATUS SUPABASE:", updateError);
        throw new InternalServerErrorException('Email berhasil dikirim, tapi gagal merubah status menjadi completed di database!');
      }

      return { message: 'Data akun berhasil dikirim ke email pembeli dan status pesanan menjadi DONE!' };
    } catch (mailError) {
      console.error("Gagal mengirim email:", mailError);
      throw new InternalServerErrorException('Gagal mengirim email, silakan cek konfigurasi akun Gmail admin.');
    }
  }
}