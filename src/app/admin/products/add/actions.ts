'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Fungsi untuk membersihkan format Rupiah menjadi angka
const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  // Menghapus 'Rp ', titik, dan karakter non-numerik lainnya
  return Number(value.replace(/[^0-9]/g, ""));
};

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

// Skema Zod dimodifikasi untuk memvalidasi angka setelah parsing
const ProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter."),
  brand: z.string().min(2, "Nama brand minimal 2 karakter."),
  price: z.number().min(1, "Harga tidak boleh nol."),
  image: z.instanceof(File).refine(file => file.size > 0, "Gambar produk wajib diunggah.").refine(file => file.size < 4 * 1024 * 1024, "Ukuran gambar maksimal 4MB."),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  screen_size: z.string().optional(),
  description: z.string().optional(),
});

export async function addProduct(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const rawData = Object.fromEntries(formData.entries());

  // Bersihkan dan konversi harga sebelum validasi
  const priceNumber = parseCurrency(rawData.price as string);

  const dataToValidate = {
    ...rawData,
    price: priceNumber,
  };
  
  const validatedFields = ProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    const errorMessage = Object.values(validatedFields.error.flatten().fieldErrors).join(' ');
    return { message: errorMessage, type: 'error' };
  }
  
  const { name, brand, price, image, processor, ram, storage, screen_size, description } = validatedFields.data;

  // 1. Upload gambar
  const fileExtension = image.name.split('.').pop();
  const fileName = `${Math.random()}-${Date.now()}.${fileExtension}`;
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, image);

  if (uploadError) {
    return { message: "Gagal mengunggah gambar: " + uploadError.message, type: 'error' };
  }

  // 2. Dapatkan URL publik
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  // 3. Masukkan data ke database
  const { error: insertError } = await supabase
    .from('laptops')
    .insert({
      name, brand, price, image_url: publicUrl,
      processor, ram, storage, screen_size, description
    });
  
  if (insertError) {
    await supabase.storage.from('product-images').remove([fileName]);
    return { message: "Gagal menambahkan produk: " + insertError.message, type: 'error' };
  }

  revalidatePath('/admin');
  redirect('/admin');
}