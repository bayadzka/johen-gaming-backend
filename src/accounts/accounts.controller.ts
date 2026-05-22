// src/accounts/accounts.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Patch, Param} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Accounts & Calculator')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('valuation-master')
  @ApiOperation({ summary: 'Ambil data master harga & poin MLBB (Admin)' })
  getValuationMaster() {
    return this.accountsService.getValuationMaster();
  }

  @Post()
  @ApiOperation({ summary: 'Simpan produk akun baru dari Kalkulator (Admin)' })
  createAccount(@Body() payload: any) {
    return this.accountsService.createAccount(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Tampilkan semua katalog akun (Publik)' })
  getAllAccounts() {
    return this.accountsService.getAllAccounts();
  }

@Put(':id')
  @ApiOperation({ summary: 'Edit data akun' })
  updateAccount(@Param('id') id: string, @Body() payload: any) {
    return this.accountsService.updateAccount(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus data akun' })
  deleteAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status cepat' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.accountsService.updateStatus(id, status);
  }
  
  @Get('games')
  @ApiOperation({ summary: 'Ambil daftar game aktif' })
  getGames() {
    return this.accountsService.getGames();
  }

  @Post('games')
  @ApiOperation({ summary: 'Tambah game baru' })
  createGame(@Body() payload: any) {
    return this.accountsService.createGame(payload);
  }

  @Get('admin-list')
  @ApiOperation({ summary: 'Tampilkan semua katalog akun tanpa filter (Admin)' })
  getAdminAccounts() {
    return this.accountsService.getAdminAccounts();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Ambil rincian detail satu akun (Pelanggan)' })
  getAccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById(id);
  }
  @Get('topup/:gameId')
  @ApiOperation({ summary: 'Ambil paket topup berdasarkan Game ID' })
  getTopupPackages(@Param('gameId') gameId: string) {
    return this.accountsService.getTopupPackages(gameId);
  }
}