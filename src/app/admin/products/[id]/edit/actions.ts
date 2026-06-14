// src/app/admin/products/[id]/edit/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // <-- Mengimpor fungsi redirect

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
};

type LaptopUpdatePayload = {
  name: string;
  brand: string;
  description: string;
  image_url?: string;
};

type VariantPayload = {
  id?: string;
  product_id: string;
  stock: number;
  processor: string;
  ram: string;
  storage: string;
  screen_size: string;
};

export async function updateProductAndVariants(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  
  const productId = formData.get('productId') as string;
  const variants: VariantFromClient[] = JSON.parse(formData.get('variants') as string);
  const variantsToDelete: string[] = JSON.parse(formData.get('variantsToDelete') as string);

  // 1. Upload Gambar Baru (Jika Diunggah)
  const image = formData.get('image') as File | null;
  let publicUrl = null;

  if (image && image.size > 0) {
    const fileExtension = image.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, image);

    if (uploadError) {
      return { message: "Gagal mengunggah gambar baru: " + uploadError.message, type: 'error' };
    }
    publicUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
  }

  // 2. Update data produk dasar (di tabel laptops)
  const laptopUpdateData: LaptopUpdatePayload = {
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    description: formData.get('description') as string,
  };

  // Masukkan gambar ke data update hanya jika ada file baru yang diunggah
  if (publicUrl) {
    laptopUpdateData.image_url = publicUrl;
  }

  const { error: laptopError } = await supabase
    .from('laptops')
    .update(laptopUpdateData)
    .eq('product_id', productId);

  if (laptopError) {
    return { message: "Gagal memperbarui produk dasar: " + laptopError.message, type: 'error' };
  }

  // 3. Update Harga di tabel master (products)
  if (variants.length > 0) {
    const mainPrice = Number(String(variants[0].price).replace(/[^0-9]/g, ""));
    const { error: productError } = await supabase
      .from('products')
      .update({ price: mainPrice })
      .eq('id', productId);
      
    if (productError) {
       return { message: "Gagal memperbarui harga utama: " + productError.message, type: 'error' };
    }
  }
  
  // 4. Update atau Insert (Upsert) varian yang ada dan baru
  if (variants.length > 0) {
    const variantsToUpsert = variants.map((v: VariantFromClient) => {
      const payload: VariantPayload = {
        product_id: productId,
        stock: Number(v.stock) || 0,
        processor: v.processor,
        ram: v.ram,
        storage: v.storage,
        screen_size: v.screen_size,
      };
      
      // Jika varian lama (sudah punya id asli dari database), sertakan id-nya untuk di-update
      if (v.id) {
        payload.id = v.id;
      }
      return payload;
    });

    const { error: upsertError } = await supabase.from('product_variants').upsert(variantsToUpsert);
    if (upsertError) {
      return { message: "Gagal menyimpan varian: " + upsertError.message, type: 'error' };
    }
  }

  // 5. Hapus varian yang ditandai untuk dihapus
  if (variantsToDelete.length > 0) {
    const { error: deleteError = null } = await supabase
      .from('product_variants')
      .delete()
      .in('id', variantsToDelete);

    if (deleteError) {
      return { message: "Gagal menghapus varian: " + deleteError.message, type: 'error' };
    }
  }

  // Bersihkan cache agar data terbaru langsung muncul
  revalidatePath(`/admin/products/${productId}/edit`, 'page');
  revalidatePath('/admin/products', 'page');
  revalidatePath('/products', 'page');
  revalidatePath('/', 'page');
  
  // 6. Redirect otomatis ke halaman admin/products jika berhasil
  redirect('/admin/products');
}