// src/products/products.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createProduct(createProductDto: CreateProductDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .insert([createProductDto])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Produk berhasil ditambahkan', data };
  }

  async getAllProducts() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data };
  }

  async getProductById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Produk tidak ditemukan');
    return { data };
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .update({ ...updateProductDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Produk berhasil diperbarui', data };
  }

  async deleteProduct(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Produk berhasil dihapus' };
  }
}