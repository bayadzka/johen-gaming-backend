// src/accounts/accounts.module.ts
import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}