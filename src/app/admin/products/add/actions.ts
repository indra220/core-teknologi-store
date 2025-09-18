// src/app/admin/products/add/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

// Skema untuk satu varian
const VariantSchema = z.object({
  price: z.string().min(1, "Harga wajib diisi."),
  stock: z.string().refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0, {
    message: "Stok harus berupa angka positif."
  }),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  screen_size: z.string().optional(),
});

// Skema utama untuk produk, sekarang termasuk array dari skema varian
const ProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter."),
  brand: z.string().min(2, "Nama brand minimal 2 karakter."),
  description: z.string().optional(),
  image: z.instanceof(File).refine(file => file.size < 4 * 1024 * 1024, "Ukuran gambar maksimal 4MB.").optional(),
  // Validasi bahwa 'variants' adalah array dan setiap itemnya sesuai dengan VariantSchema
  variants: z.array(VariantSchema).min(1, "Produk harus memiliki setidaknya satu varian."),
});

export async function addProductWithVariants(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  // Ekstrak dan parse data varian dari FormData
  const variantsData = JSON.parse(formData.get('variants') as string);
  const rawFormData = Object.fromEntries(formData);

  const validatedFields = ProductSchema.safeParse({
    ...rawFormData,
    variants: variantsData
  });
  
  if (!validatedFields.success) {
    // Mengambil pesan error pertama dari field manapun, termasuk dari dalam varian
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] 
                      || validatedFields.error.flatten().formErrors[0]
                      || "Input tidak valid.";
    return { message: firstError, type: 'error' };
  }

  const { name, brand, description, image, variants } = validatedFields.data;

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
  
  // Memformat varian untuk disisipkan ke database
  const variantsToInsert = variants.map((variant) => ({
    product_id: newProduct.id,
    price: Number(String(variant.price).replace(/[^0-9]/g, "")),
    processor: variant.processor || null,
    ram: variant.ram || null,
    storage: variant.storage || null,
    screen_size: variant.screen_size || null,
    stock: Number(variant.stock),
  }));
  
  const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);

  if (variantsError) {
    await supabase.from('products').delete().eq('id', newProduct.id);
    return { message: "Gagal menambahkan varian produk: " + variantsError.message, type: 'error' };
  }

  revalidateTag('products');
  revalidateTag('dashboard-stats');
  redirect('/admin/products');
}