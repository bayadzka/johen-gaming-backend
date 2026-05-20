import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as WebSocket from 'ws'; // <-- Import WebSocket di sini

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ ERROR: Supabase URL atau Key tidak ditemukan di file .env');
      return;
    }

    // Inisialisasi dengan tambahan konfigurasi untuk Node.js v20
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Best practice untuk server/back-end
      },
      realtime: {
        transport: WebSocket as any, // <-- Menyuntikkan 'ws' ke Supabase
      },
    });
    
    console.log('✅ Supabase Client berhasil diinisialisasi');
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client belum siap. Cek konfigurasi .env kamu.');
    }
    return this.supabase;
  }
}