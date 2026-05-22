import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as WebSocket from 'ws';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient!: SupabaseClient;
  private anonClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error('❌ ERROR: Kredensial Supabase tidak lengkap di .env');
      return;
    }

    const options = {
      auth: { persistSession: false },
      realtime: { transport: WebSocket as any },
    };

    // Client Anon khusus untuk operasi Auth (Register/Login)
    this.anonClient = createClient(supabaseUrl, anonKey, options);
    
    // Client Admin khusus untuk operasi CRUD Database
    this.adminClient = createClient(supabaseUrl, serviceKey, options);
    
    console.log('✅ Supabase Dual-Client berhasil diinisialisasi');
  }

  // Panggil fungsi ini di Auth Service
  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }

  // Otomatis terpakai di Products & Orders Service
  getClient(): SupabaseClient {
    return this.adminClient;
  }
}