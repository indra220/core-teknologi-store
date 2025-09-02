'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from 'zod';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  return Number(value.replace(/[^0-9]/g, ""));
};

const UpdateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Nama produk minimal 3 karakter."),
  brand: z.string().min(2, "Nama brand minimal 2 karakter."),
  price: z.number().min(1, "Harga tidak boleh nol."),
  image: z.instanceof(File).optional(),
});

// Pastikan fungsi ini diekspor (ada 'export' di depannya)
export async function updateProduct(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const rawData = Object.fromEntries(formData.entries());

  const priceNumber = parseCurrency(rawData.price as string);
  
  const dataToValidate = { ...rawData, price: priceNumber };
  const validatedFields = UpdateProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    const errorMessage = Object.values(validatedFields.error.flatten().fieldErrors).join(' ');
    return { message: errorMessage, type: 'error' };
  }

  const { id, name, brand, price, image } = validatedFields.data;
  let imageUrl = formData.get('current_image_url') as string;

  if (image && image.size > 0) {
    const fileExtension = image.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, image);

    if (uploadError) {
      return { message: "Gagal mengunggah gambar baru: " + uploadError.message, type: 'error' };
    }

    imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
    
    const oldFileName = (formData.get('current_image_url') as string).split('/').pop();
    if (oldFileName) {
      await supabase.storage.from('product-images').remove([oldFileName]);
    }
  }
  
  const otherData: { [key: string]: FormDataEntryValue } = {};
  for (const key of ['processor', 'ram', 'storage', 'screen_size', 'description']) {
    if (formData.has(key)) {
      otherData[key] = formData.get(key) as string;
    }
  }

  const { error: updateError } = await supabase
    .from('laptops')
    .update({ 
      name, 
      brand, 
      price, 
      image_url: imageUrl,
      ...otherData 
    })
    .eq('id', id);

  if (updateError) {
    return { message: "Gagal memperbarui produk: " + updateError.message, type: 'error' };
  }

  revalidatePath('/admin');
  return { message: 'Produk berhasil diperbarui!', type: 'success' };
}