// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          full_name: registerDto.full_name, 
          phone: registerDto.phone, // <--- TAMBAHKAN BARIS INI
        },
      },
    });

    if (error) throw new BadRequestException(error.message);
    return { message: 'Registrasi berhasil', user: data.user };
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) throw new UnauthorizedException('Email atau password salah');
    return { message: 'Login berhasil', session: data.session };
  }

  async logout() {
    // Dalam arsitektur JWT stateless (Session/JWT auth), logout yang paling efektif adalah menghapus token di sisi client (Front-end)
    return { message: 'Logout berhasil. Silakan hapus token sesi di sisi aplikasi pengguna.' };
  }
}