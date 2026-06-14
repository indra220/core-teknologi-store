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

// Skema Varian (Harga dimasukkan kembali ke sini untuk validasi UI)
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

// Skema Produk Induk
const ProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter."),
  brand: z.string().min(2, "Nama brand minimal 2 karakter."),
  description: z.string().optional(),
  image: z.instanceof(File).refine(file => file.size === 0 || file.size < 4 * 1024 * 1024, "Ukuran gambar maksimal 4MB.").optional(),
  variants: z.array(VariantSchema).min(1, "Produk harus memiliki setidaknya satu varian."),
});

export async function addProductWithVariants(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const variantsData = JSON.parse(formData.get('variants') as string);
  const rawFormData = Object.fromEntries(formData);

  const validatedFields = ProductSchema.safeParse({
    ...rawFormData,
    variants: variantsData
  });
  
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] 
                      || validatedFields.error.flatten().formErrors[0]
                      || "Input tidak valid.";
    return { message: firstError as string, type: 'error' };
  }

  const { name, brand, description, image, variants } = validatedFields.data;

  // 1. Upload Gambar (Jika Ada)
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

  // 2. Insert ke Tabel Master (products)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  // MENGAMBIL HARGA DARI VARIAN PERTAMA UNTUK TABEL UTAMA
  const numericPrice = Number(String(variants[0].price).replace(/[^0-9]/g, ""));

  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({ 
      slug, 
      price: numericPrice 
    })
    .select('id')
    .single();

  if (productError || !newProduct) {
    return { message: "Gagal membuat produk utama: " + productError?.message, type: 'error' };
  }

  // 3. Insert ke Tabel Detail (laptops)
  const { error: laptopsError } = await supabase
    .from('laptops')
    .insert({ 
      product_id: newProduct.id, 
      name, 
      brand, 
      description, 
      image_url: publicUrl 
    });

  if (laptopsError) {
    await supabase.from('products').delete().eq('id', newProduct.id); // Rollback
    return { message: "Gagal menyimpan detail laptop: " + laptopsError.message, type: 'error' };
  }
  
  // 4. Insert ke Tabel Inventory (product_variants)
  // Perhatikan: Kita TIDAK memasukkan 'price' ke sini, karena sudah di tabel products
  const variantsToInsert = variants.map((variant) => ({
    product_id: newProduct.id,
    processor: variant.processor || null,
    ram: variant.ram || null,
    storage: variant.storage || null,
    screen_size: variant.screen_size || null,
    stock: Number(variant.stock),
  }));
  
  const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);

  if (variantsError) {
    await supabase.from('products').delete().eq('id', newProduct.id); // Rollback
    return { message: "Gagal menambahkan varian: " + variantsError.message, type: 'error' };
  }

  revalidatePath('/admin/products', 'page');
  revalidatePath('/products', 'page');
  revalidatePath('/', 'page');
  
  redirect('/admin/products');
}