import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'tester@johangaming.com', description: 'Email pengguna baru' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password minimal 6 karakter' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @ApiProperty({ example: 'Bayu Azka', description: 'Nama lengkap pengguna' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  full_name!: string;

  @ApiProperty({ example: '08123456789', description: 'Nomor telepon pengguna', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'tester@johangaming.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password!: string;
}