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

  if (!orderId || !newStatus) return { success: false, message: "Data tidak lengkap." };

  const supabase = await createClient();

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, message: "Akses ditolak." };

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') return { success: false, message: "Anda tidak memiliki izin." };

  // 1. TARIK STATUS, DETAIL TRANSAKSI, TANGGAL, DAN ITEM PESANAN
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select(`
        status, 
        user_id, 
        total_amount, 
        payment_method, 
        created_at,
        order_items (product_name, quantity)
    `)
    .eq('id', orderId)
    .single();

  if (fetchError || !currentOrder) return { success: false, message: "Pesanan tidak ditemukan." };

  // =======================================================================
  // REKONSTRUKSI DISPLAY ID (Sama persis dengan saat pesanan dibuat)
  // =======================================================================
  const orderDate = new Date(currentOrder.created_at);
  const yy = orderDate.getFullYear().toString().slice(-2);
  const mm = String(orderDate.getMonth() + 1).padStart(2, '0');
  const dd = String(orderDate.getDate()).padStart(2, '0');
  const dStr = `${yy}${mm}${dd}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstItem = currentOrder.order_items?.[0] as any;
  const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalQty = currentOrder.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
  const uniqueTail = orderId.split('-')[0].substring(0, 4).toUpperCase();
  
  const displayId = `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
  // =======================================================================

  if ((currentOrder.status === 'Dalam Pengiriman' || currentOrder.status === 'Selesai') && newStatus === 'Dibatalkan') {
    return { success: false, message: "Pesanan yang sudah dalam pengiriman tidak dapat dibatalkan!" };
  }

  // 2. PEMOTONGAN SALDO DOMPET OLEH ADMIN 
  if (newStatus === 'Diproses' && currentOrder.status === 'Menunggu Konfirmasi' && currentOrder.payment_method === 'wallet') {
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', currentOrder.user_id).single();
      
      if ((profile?.wallet_balance || 0) < currentOrder.total_amount) {
          return { success: false, message: "Gagal memproses: Saldo Core Wallet pelanggan tidak mencukupi untuk pesanan ini." };
      }

      const { error: deductError } = await supabase.from('profiles')
          .update({ wallet_balance: (profile?.wallet_balance || 0) - currentOrder.total_amount })
          .eq('id', currentOrder.user_id);
          
      if (deductError) return { success: false, message: "Gagal memotong saldo dompet pelanggan." };
  }

  // 3. PROSES UPDATE ATAU PEMBATALAN VIA RPC
  if (newStatus === 'Dibatalkan' && currentOrder.status !== 'Dibatalkan') {
      const { error: rpcError } = await supabase.rpc('cancel_order_and_refund_to_wallet', {
          order_id_to_cancel: orderId,
          new_status: 'Dibatalkan'
      });

      if (rpcError) {
          console.error('RPC Error pembatalan oleh admin:', rpcError);
          return { success: false, message: "Gagal membatalkan pesanan. Terjadi kesalahan pada sistem." };
      }
  } else {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) return { success: false, message: `Gagal: ${error.message}` };
  }

  // 4. KIRIM NOTIFIKASI PENGKONDISIAN PINTAR KE USER TAMPILAN
  let notificationMessage = '';
  
  if (newStatus === 'Diproses') {
    if (currentOrder.payment_method === 'wallet') {
      notificationMessage = `Pesanan Anda #${displayId} sedang kami proses. Saldo Core Wallet Anda telah berhasil dipotong.`;
    } else if (currentOrder.payment_method === 'paypal') {
      notificationMessage = `Pesanan Anda #${displayId} sedang kami proses. Pembayaran via PayPal Anda telah diverifikasi.`;
    } else {
      notificationMessage = `Pesanan Anda #${displayId} sedang kami proses.`;
    }
  } else if (newStatus === 'Dalam Pengiriman') {
    notificationMessage = `Pesanan Anda #${displayId} telah dikirim! Mohon konfirmasi jika pesanan sudah diterima.`;
  } else if (newStatus === 'Dibatalkan') {
    const didRefund = currentOrder.payment_method === 'paypal' || (currentOrder.payment_method === 'wallet' && currentOrder.status === 'Diproses');
    
    if (didRefund) {
        const formattedRefundAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentOrder.total_amount);
        notificationMessage = `Pesanan Anda #${displayId} telah dibatalkan oleh Admin. Dana sebesar ${formattedRefundAmount} telah dikembalikan ke Core Wallet Anda.`;
    } else {
        notificationMessage = `Pesanan Anda #${displayId} telah dibatalkan oleh Admin.`;
    }
  }

  if (notificationMessage && currentOrder.user_id) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: currentOrder.user_id,
      message: notificationMessage,
      link: `/orders/${orderId}`,
      read_at: null 
    });

    if (notifError) {
      console.error("Gagal mengirim notifikasi ke user:", notifError);
    }
  }

  // Membersihkan Cache
  // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen
  revalidateTag('admin-orders');
  // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen
  revalidateTag(`orders/${currentOrder.user_id}`);
  // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen
  revalidateTag('notifications');
  // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen
  revalidateTag('dashboard-stats');
  
  return { success: true, message: "Status pesanan berhasil diperbarui." };
}