'use server';
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProduct(productId: string, imageUrl: string | null) {
  const supabase = await createClient();

  // 1. Hapus gambar dari Storage jika ada
  if (imageUrl) {
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('product-images').remove([fileName]);
    }
  }

  // 2. Hapus data produk dari database
  const { error } = await supabase.from('laptops').delete().eq('id', productId);

  if (error) {
    return { success: false, message: "Gagal menghapus produk." };
  }

  revalidatePath('/admin');
  return { success: true, message: "Produk berhasil dihapus." };
}