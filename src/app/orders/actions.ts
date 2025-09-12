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

  if (order.status !== 'Menunggu Konfirmasi') {
    return { success: false, message: `Pesanan dengan status "${order.status}" tidak dapat dibatalkan.` };
  }

  const { error: rpcError } = await supabase.rpc('cancel_order_and_restore_stock', {
    order_id_to_cancel: orderId,
    new_status: 'Dibatalkan'
  });

  if (rpcError) {
    console.error('RPC Error saat membatalkan pesanan:', rpcError);
    return { success: false, message: "Gagal membatalkan pesanan. Silakan coba lagi." };
  }
  
  await supabase.from('notifications').insert({
      user_id: user.id,
      message: `Pesanan Anda #${orderId.substring(0, 8)} telah berhasil dibatalkan.`,
      link: '/orders',
  });

  revalidatePath('/orders');
  return { success: true, message: "Pesanan berhasil dibatalkan." };
}

export async function confirmOrderReceived(orderId: string): Promise<ActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "Anda harus login untuk melakukan aksi ini." };
    }

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, user_id')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        return { success: false, message: "Pesanan tidak ditemukan." };
    }

    if (order.user_id !== user.id) {
        return { success: false, message: "Akses ditolak." };
    }

    if (order.status !== 'Dalam Pengiriman') {
        return { success: false, message: "Hanya pesanan yang sedang dikirim yang dapat dikonfirmasi." };
    }

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Selesai' })
        .eq('id', orderId);

    if (updateError) {
        return { success: false, message: "Gagal mengonfirmasi pesanan." };
    }

    revalidatePath('/orders');
    revalidatePath('/admin/report');
    revalidatePath('/admin/orders');

    return { success: true, message: "Pesanan telah diselesaikan. Terima kasih telah berbelanja!" };
}