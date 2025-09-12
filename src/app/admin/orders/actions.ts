// src/app/admin/orders/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/types";

type ActionResult = {
  success: boolean;
  message: string;
};

// --- 1. TAMBAHKAN 'prevState' SEBAGAI PARAMETER PERTAMA ---
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

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    return { success: false, message: `Gagal memperbarui status: ${error.message}` };
  }

  let notificationMessage = '';
  if (newStatus === 'Diproses') {
    notificationMessage = `Pesanan Anda #${orderId.substring(0, 8)} sedang kami proses.`;
  } else if (newStatus === 'Dalam Pengiriman') {
    notificationMessage = `Pesanan Anda #${orderId.substring(0, 8)} telah dikirim! Mohon konfirmasi jika sudah diterima.`;
  }

  if (notificationMessage && userId) {
    await supabase.from('notifications').insert({
      user_id: userId,
      message: notificationMessage,
      link: '/orders'
    });
  }

  revalidatePath('/admin/orders');
  revalidatePath('/orders');
  return { success: true, message: "Status pesanan berhasil diperbarui." };
}