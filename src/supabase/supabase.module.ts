import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // <-- Tambahkan baris ini agar bisa dipakai modul lain
})
export class SupabaseModule {}