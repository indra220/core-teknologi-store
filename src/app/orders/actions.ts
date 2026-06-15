// src/app/orders/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

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

  // PERBAIKAN: Menambahkan paypal_order_id ke dalam select()
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, user_id, paypal_order_id')
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

  // Memanggil fungsi SQL yang akan membatalkan, me-refund saldo, dan mengembalikan stok
  const { error: rpcError } = await supabase.rpc('cancel_order_and_refund_to_wallet', {
    order_id_to_cancel: orderId,
    new_status: 'Dibatalkan'
  });

  if (rpcError) {
    console.error('RPC Error saat membatalkan pesanan:', rpcError);
    return { success: false, message: "Gagal membatalkan pesanan. Silakan coba lagi." };
  }
  
  // PERBAIKAN: Gunakan paypal_order_id untuk notifikasi pembatalan
  const displayOrderId = order.paypal_order_id || orderId.substring(0, 8);
  
  await supabase.from('notifications').insert({
      user_id: user.id,
      message: `Pesanan Anda #${displayOrderId} telah dibatalkan. Dana telah dikembalikan ke dompet Anda.`,
      link: '/orders',
  });

  revalidateTag(`orders/${user.id}`, 'max');
  revalidateTag('admin-orders', 'max');
  revalidateTag('notifications', 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { success: true, message: "Pesanan berhasil dibatalkan. Saldo telah masuk ke dompet Anda." };
}

export async function confirmOrderReceived(orderId: string): Promise<ActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "Anda harus login untuk melakukan aksi ini." };
    }

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, user_id, profiles ( username )')
        .eq('id', orderId)
        .single<{ status: string; user_id: string; profiles: { username: string } | { username: string }[] }>();

    if (fetchError || !order) {
        return { success: false, message: "Pesanan tidak ditemukan." };
    }

    if (order.user_id !== user.id) {
        return { success: false, message: "Akses ditolak." };
    }

    if (order.status !== 'Dalam Pengiriman') {
        return { success: false, message: "Hanya pesanan yang sedang dikirim yang dapat dikonfirmasi." };
    }

    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Selesai' })
        .eq('id', orderId)
        .select(); 

    if (updateError) {
        console.error("Supabase update error:", updateError);
        return { success: false, message: `Gagal mengonfirmasi pesanan: ${updateError.message}` };
    }

    if (!updatedOrder || updatedOrder.length === 0) {
        return { success: false, message: "Gagal menyimpan perubahan. Kemungkinan karena masalah RLS (Row Level Security) pada database." };
    }

    try {
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (admins && admins.length > 0) {
            const customerUsername = Array.isArray(order.profiles) 
                ? order.profiles[0]?.username 
                : order.profiles?.username || 'Seorang pelanggan';
            
            const adminNotifications = admins.map(admin => ({
                user_id: admin.id,
                message: `${customerUsername} telah menyelesaikan pesanan #${orderId.substring(0, 8)}.`,
                link: `/admin/orders/${orderId}`
            }));
            await supabase.from('notifications').insert(adminNotifications);
        }
    } catch (e) {
        console.error("Gagal mengirim notifikasi ke admin:", e);
    }

    revalidateTag(`orders/${user.id}`, 'max');
    revalidateTag('admin-orders', 'max');
    revalidateTag('admin-reports', 'max');
    revalidateTag('notifications', 'max');
    revalidateTag('dashboard-stats', 'max');

    return { success: true, message: "Pesanan telah diselesaikan. Terima kasih telah berbelanja!" };
}