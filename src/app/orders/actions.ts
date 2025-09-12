// src/app/orders/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Anda harus login untuk membatalkan pesanan." };
  }

  // Ambil pesanan untuk verifikasi kepemilikan dan status
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, message: "Pesanan tidak ditemukan." };
  }

  if (order.user_id !== user.id) {
    return { success: false, message: "Anda tidak memiliki izin untuk membatalkan pesanan ini." };
  }

  // Hanya izinkan pembatalan jika statusnya 'Menunggu Konfirmasi'
  if (order.status !== 'Menunggu Konfirmasi') {
    return { success: false, message: `Pesanan dengan status "${order.status}" tidak dapat dibatalkan.` };
  }

  // Panggil fungsi RPC database untuk membatalkan pesanan dan mengembalikan stok
  const { error: rpcError } = await supabase.rpc('cancel_order_and_restore_stock', {
    order_id_to_cancel: orderId,
    new_status: 'Dibatalkan'
  });

  if (rpcError) {
    console.error('RPC Error saat membatalkan pesanan:', rpcError);
    return { success: false, message: "Gagal membatalkan pesanan. Silakan coba lagi." };
  }
  
  // Buat notifikasi untuk pengguna setelah pembatalan berhasil
  await supabase.from('notifications').insert({
      user_id: user.id,
      message: `Pesanan Anda #${orderId.substring(0, 8)} telah berhasil dibatalkan.`,
      link: '/orders',
  });

  // Revalidasi path agar halaman pesanan menampilkan data terbaru
  revalidatePath('/orders');
  return { success: true, message: "Pesanan berhasil dibatalkan." };
}