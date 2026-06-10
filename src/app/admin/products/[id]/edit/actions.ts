// src/app/admin/products/[id]/edit/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

type VariantFromClient = {
  id?: string;
  product_id?: string;
  price: string | number;
  stock: string | number;
  processor: string;
  ram: string;
  storage: string;
  screen_size: string;
}

export async function updateProductAndVariants(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  
  const productId = formData.get('productId') as string;
  const variants: VariantFromClient[] = JSON.parse(formData.get('variants') as string);
  const variantsToDelete: string[] = JSON.parse(formData.get('variantsToDelete') as string);

  // 1. Update data produk dasar
  // MENYESUAIKAN: Mengubah nama tabel ke 'laptops'
  const { error: productError } = await supabase
    .from('laptops')
    .update({
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      description: formData.get('description') as string,
    })
    .eq('id', productId);

  if (productError) {
    return { message: "Gagal memperbarui produk dasar: " + productError.message, type: 'error' };
  }
  
  // 2. Update atau Insert (Upsert) varian yang ada dan baru
  if (variants.length > 0) {
    const variantsToUpsert = variants.map((v: VariantFromClient) => ({
      id: v.id,
      product_id: productId,
      price: Number(String(v.price).replace(/[^0-9]/g, "")),
      stock: Number(v.stock) || 0,
      processor: v.processor,
      ram: v.ram,
      storage: v.storage,
      screen_size: v.screen_size,
    }));

    const { error: upsertError } = await supabase.from('product_variants').upsert(variantsToUpsert);
    if (upsertError) {
      return { message: "Gagal menyimpan varian: " + upsertError.message, type: 'error' };
    }
  }

  // 3. Hapus varian yang ditandai untuk dihapus
  if (variantsToDelete.length > 0) {
    const { error: deleteError = null } = await supabase
      .from('product_variants')
      .delete()
      .in('id', variantsToDelete);

    if (deleteError) {
      return { message: "Gagal menghapus varian: " + deleteError.message, type: 'error' };
    }
  }

  revalidateTag('products', 'max');
  revalidateTag(`products/${productId}`, 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { message: 'Produk dan varian berhasil diperbarui!', type: 'success' };
}