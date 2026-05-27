import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Kita pasang jaring pengaman. Kalau env kosong, pakai URL hardcode ini
    const supabaseUrl = process.env.SUPABASE_URL || 'https://uehkjsmiyyfvuyblwzau.supabase.co';
    
    // Key tetap wajib dari env demi keamanan
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}