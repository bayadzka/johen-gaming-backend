// src/accounts/accounts.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AccountsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Ambil Data Master Valuasi (Untuk checklist & input di Dashboard Admin)
  async getValuationMaster() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('mlbb_valuation_master')
      .select('*')
      .order('base_value', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  // 2. Simpan Akun Baru (Dipanggil setelah Admin selesai berhitung di Kalkulator)
  async createAccount(payload: any) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('account_products')
      .insert([payload])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Akun MLBB berhasil ditambahkan ke katalog', data };
  }

  // Update Akun (Edit)
  async updateAccount(id: string, payload: any) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('account_products').update(payload).eq('id', id).select().single();
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Akun berhasil diupdate', data };
  }
  // Hapus Akun
  async deleteAccount(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('account_products').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Akun berhasil dihapus' };
  }

  // Update Status Cepat (Tersedia / Terjual)
  async updateStatus(id: string, status: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('account_products').update({ status }).eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: `Status diubah menjadi ${status}` };
  }

  // 3. Tampilkan Daftar Akun (Untuk halaman utama johengaming.com)
  async getAllAccounts() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('account_products')
      .select('*, games(name)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  // Tampilkan SEMUA Daftar Akun (Khusus untuk halaman Admin Dashboard)
  async getAdminAccounts() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('account_products')
      .select('*, games(name)')
      .order('created_at', { ascending: false }); // Tanpa filter status 'available'

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  // Ambil daftar game
  async getGames() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: true });
    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  // Tambah game baru
  async createGame(payload: any) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('games').insert([payload]).select().single();
    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }
  // Ambil detail rincian satu akun berdasarkan ID
  async getAccountById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('account_products')
      .select('*, games(name)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Akun tidak ditemukan atau sudah dihapus');
    return { data };
  }
  // Ambil paket topup berdasarkan Game ID
  async getTopupPackages(gameId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('topup_packages').select('*').eq('game_id', gameId);
    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }
}