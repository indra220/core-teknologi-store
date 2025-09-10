// src/app/admin/products/add/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

// Tipe data untuk varian yang diterima dari form
type VariantData = {
    price: string;
    stock: string;
    processor: string;
    ram: string;
    storage: string;
    screen_size: string;
}

const ProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter."),
  brand: z.string().min(2, "Nama brand minimal 2 karakter."),
  description: z.string().optional(),
  image: z.instanceof(File).refine(file => file.size < 4 * 1024 * 1024, "Ukuran gambar maksimal 4MB.").optional(),
});

export async function addProductWithVariants(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    const errorMessage = Object.values(validatedFields.error.flatten().fieldErrors).join(' ');
    return { message: errorMessage, type: 'error' };
  }
  const { name, brand, description, image } = validatedFields.data;

  let publicUrl = null;
  if (image && image.size > 0) {
    const fileExtension = image.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, image);

    if (uploadError) {
      return { message: "Gagal mengunggah gambar: " + uploadError.message, type: 'error' };
    }
    publicUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
  }

  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({ name, brand, description, image_url: publicUrl })
    .select('id')
    .single();

  if (productError || !newProduct) {
    return { message: "Gagal membuat produk dasar: " + productError?.message, type: 'error' };
  }

  const variants = JSON.parse(formData.get('variants') as string);
  if (!variants || variants.length === 0) {
     return { message: "Produk harus memiliki setidaknya satu varian.", type: 'error' };
  }

  // Ganti `any` dengan tipe `VariantData` yang sudah kita definisikan
  const variantsToInsert = variants.map((variant: VariantData) => ({
    product_id: newProduct.id,
    price: Number(String(variant.price).replace(/[^0-9]/g, "")),
    processor: variant.processor,
    ram: variant.ram,
    storage: variant.storage,
    screen_size: variant.screen_size,
    stock: Number(variant.stock) || 0,
  }));
  
  const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);

  if (variantsError) {
    await supabase.from('products').delete().eq('id', newProduct.id);
    return { message: "Gagal menambahkan varian produk: " + variantsError.message, type: 'error' };
  }

  revalidatePath('/admin/products');
  redirect('/admin/products');
}