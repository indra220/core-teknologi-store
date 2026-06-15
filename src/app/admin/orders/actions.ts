// src/app/admin/orders/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { OrderStatus } from "@/types";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function updateOrderStatus(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const orderId = formData.get('orderId') as string;
  const newStatus = formData.get('status') as OrderStatus;
  const userId = formData.get('userId') as string;

  // Cek jika tidak ada perubahan
  if (!orderId || !newStatus) {
    return { success: false, message: "Data tidak lengkap." };
  }

  const supabase = await createClient();

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, message: "Akses ditolak." };

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') {
    return { success: false, message: "Anda tidak memiliki izin untuk melakukan aksi ini." };
  }

  // 1. CEK STATUS SAAT INI (Backend Validation)
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (fetchError || !currentOrder) {
    return { success: false, message: "Pesanan tidak ditemukan." };
  }

  // VALIDASI: Cegah pembatalan jika status sudah "Dalam Pengiriman" atau "Selesai"
  if ((currentOrder.status === 'Dalam Pengiriman' || currentOrder.status === 'Selesai') && newStatus === 'Dibatalkan') {
    return { success: false, message: "Pesanan yang sudah dalam pengiriman (atau selesai) tidak dapat dibatalkan!" };
  }

  // 2. PROSES UPDATE ATAU PEMBATALAN (Dengan Refund)
  if (newStatus === 'Dibatalkan' && currentOrder.status !== 'Dibatalkan') {
      // Jika Admin membatalkan, panggil RPC agar uang kembali ke dompet user
      const { error: rpcError } = await supabase.rpc('cancel_order_and_refund_to_wallet', {
          order_id_to_cancel: orderId,
          new_status: 'Dibatalkan'
      });

      if (rpcError) {
          console.error('RPC Error pembatalan oleh admin:', rpcError);
          return { success: false, message: "Gagal membatalkan pesanan. Terjadi kesalahan pada sistem pengembalian dana." };
      }
  } else {
      // Proses Update Status Biasa
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        return { success: false, message: `Gagal memperbarui status: ${error.message}` };
      }
  }

  // 3. KIRIM NOTIFIKASI KE USER
  let notificationMessage = '';
  if (newStatus === 'Diproses') {
    notificationMessage = `Pesanan Anda #${orderId.substring(0, 8)} sedang kami proses.`;
  } else if (newStatus === 'Dalam Pengiriman') {
    notificationMessage = `Pesanan Anda #${orderId.substring(0, 8)} telah dikirim! Mohon konfirmasi jika pesanan sudah diterima.`;
  } else if (newStatus === 'Dibatalkan') {
    notificationMessage = `Pesanan Anda #${orderId.substring(0, 8)} telah dibatalkan oleh Admin. Dana telah dikembalikan ke saldo Anda (jika menggunakan dompet).`;
  }

  if (notificationMessage && userId) {
    await supabase.from('notifications').insert({
      user_id: userId,
      message: notificationMessage,
      link: '/orders'
    });
  }

  revalidateTag('admin-orders', 'max');
  revalidateTag(`orders/${userId}`, 'max');
  revalidateTag('notifications', 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { success: true, message: "Status pesanan berhasil diperbarui." };
}