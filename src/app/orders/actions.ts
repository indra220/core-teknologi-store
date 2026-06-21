// src/app/orders/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

interface OrderItemForId {
  product_name?: string;
  quantity?: number;
}

interface OrderDataForId {
  created_at: string;
  order_items?: OrderItemForId[] | null;
}

interface ConfirmOrderData extends OrderDataForId {
  status: string;
  user_id: string;
  profiles: { username: string } | { username: string }[] | null;
}

// PERBAIKAN: Menambahkan 'profiles' ke dalam interface CancelOrderData 
// agar kita tidak perlu lagi menggunakan tipe data 'any'
interface CancelOrderData extends OrderDataForId {
  status: string;
  user_id: string;
  payment_method: string;
  total_amount: number;
  profiles?: { username: string } | { username: string }[] | null;
}

function generateDisplayId(order: OrderDataForId, orderId: string) {
    const date = new Date(order.created_at || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;
    
    const firstItem = order.order_items?.[0];
    const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
    
    const totalQty = order.order_items?.reduce((sum: number, item: OrderItemForId) => sum + (item.quantity || 1), 0) || 0;
    const uniqueTail = orderId.split('-')[0].substring(0, 4).toUpperCase();
    
    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Anda harus login." };

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, user_id, payment_method, total_amount, created_at, order_items(product_name, quantity), profiles(username)')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) return { success: false, message: "Pesanan tidak ditemukan." };

  // PERBAIKAN: Memanfaatkan CancelOrderData dengan benar untuk TypeScript
  const typedOrder = order as unknown as CancelOrderData;

  if (typedOrder.user_id !== user.id) return { success: false, message: "Akses ditolak." };
  if (typedOrder.status !== 'Menunggu Konfirmasi') return { success: false, message: "Pesanan tidak dapat dibatalkan." };

  const { error: rpcError } = await supabase.rpc('cancel_order_and_refund_to_wallet', {
      order_id_to_cancel: orderId,
      new_status: 'Dibatalkan'
  });

  if (rpcError) {
      console.error('RPC Error pembatalan:', rpcError);
      return { success: false, message: "Gagal membatalkan pesanan. Sistem sedang sibuk." };
  }

  const displayOrderId = generateDisplayId(typedOrder, orderId);
  
  let refundMessage = '';
  if (typedOrder.payment_method === 'paypal') {
      const formattedRefundAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(typedOrder.total_amount);
      refundMessage = ` Dana sebesar ${formattedRefundAmount} telah dikembalikan ke Core Wallet Anda.`;
  }
  
  // 1. Kirim notifikasi ke user yang melakukan pembatalan
  await supabase.from('notifications').insert({
      user_id: user.id,
      message: `Pesanan Anda #${displayOrderId} telah dibatalkan.${refundMessage}`,
      link: '/orders',
  });

  // 2. Kirim notifikasi REAL-TIME KE SEMUA ADMIN
  try {
      const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

      if (admins && admins.length > 0) {
          const customerName = Array.isArray(typedOrder.profiles) 
              ? typedOrder.profiles[0]?.username 
              : (typedOrder.profiles as { username: string })?.username || 'Pelanggan';

          const adminNotifications = admins.map(admin => ({
              user_id: admin.id,
              message: `[Pembatalan] ${customerName} telah membatalkan pesanan #${displayOrderId}.`,
              link: `/admin/orders/${orderId}`,
          }));
          
          await supabase.from('notifications').insert(adminNotifications);
      }
  } catch (adminErr) {
      console.error("Gagal mengirim notifikasi pembatalan ke admin:", adminErr);
  }

  revalidateTag(`orders/${user.id}`, 'max');
  revalidateTag('admin-orders', 'max');
  revalidateTag('notifications', 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { success: true, message: "Pesanan berhasil dibatalkan." };
}

export async function confirmOrderReceived(orderId: string): Promise<ActionResult> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Anda harus login." };

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, user_id, created_at, profiles ( username ), order_items(product_name, quantity)')
        .eq('id', orderId)
        .single(); 

    if (fetchError || !order) return { success: false, message: "Pesanan tidak ditemukan." };

    const typedOrder = order as unknown as ConfirmOrderData;

    if (typedOrder.user_id !== user.id) return { success: false, message: "Akses ditolak." };
    if (typedOrder.status !== 'Dalam Pengiriman') return { success: false, message: "Hanya pesanan yang sedang dikirim yang dapat dikonfirmasi." };

    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Selesai' })
        .eq('id', orderId)
        .select(); 

    if (updateError) return { success: false, message: `Gagal: ${updateError.message}` };
    if (!updatedOrder || updatedOrder.length === 0) return { success: false, message: "Gagal menyimpan data." };

    try {
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');

        if (admins && admins.length > 0) {
            const customerUsername = Array.isArray(typedOrder.profiles) 
                ? typedOrder.profiles[0]?.username 
                : (typedOrder.profiles as { username: string })?.username || 'Seorang pelanggan';
            
            const displayOrderId = generateDisplayId(typedOrder, orderId);
            
            const adminNotifications = admins.map(admin => ({
                user_id: admin.id,
                message: `${customerUsername} telah menyelesaikan pesanan #${displayOrderId}.`,
                link: `/admin/orders/${orderId}`
            }));
            await supabase.from('notifications').insert(adminNotifications);
        }
    } catch (e) {
        console.error("Gagal mengirim notifikasi:", e);
    }

    revalidateTag(`orders/${user.id}`, 'max');
    revalidateTag('admin-orders', 'max');
    revalidateTag('admin-reports', 'max');
    revalidateTag('notifications', 'max');
    revalidateTag('dashboard-stats', 'max');

    return { success: true, message: "Pesanan diselesaikan. Terima kasih telah berbelanja!" };
}