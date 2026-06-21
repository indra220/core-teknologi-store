// src/app/checkout/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { CartItem } from "@/context/CartContext";

type ActionResult = {
  success: boolean;
  message: string;
};

export type ShippingAddress = {
  address_line_1: string;
  admin_area_2: string;
  admin_area_1: string;
  postal_code: string;
  country_code: string;
};

// =========================================================================
// FUNGSI DINAMIS GENERATOR ID SERAGAM
// =========================================================================
function generateDisplayIdFromCart(cartItems: CartItem[], orderId: string) {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;

    const firstItem = cartItems[0];
    const categoryChar = firstItem?.name ? firstItem.name.charAt(0).toUpperCase() : 'P';

    const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const uniqueTail = orderId ? orderId.split('-')[0].substring(0, 4).toUpperCase() : 'XXXX';

    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
}

export async function createOrderFromWallet(cartItems: CartItem[], shippingAddress: ShippingAddress): Promise<ActionResult> {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: "Keranjang Anda kosong." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Anda harus login untuk melakukan pembayaran." };
  }
  
  if (!shippingAddress || !shippingAddress.address_line_1) {
      return { success: false, message: "Alamat pengiriman tidak valid atau kosong." };
  }

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // 1. CEK SALDO DOMPET USER TERLEBIH DAHULU (Validasi)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('wallet_balance, username')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
      return { success: false, message: "Gagal memuat profil pengguna." };
  }
  
  if (profile.wallet_balance < cartTotal) {
      return { success: false, message: "Saldo Core Wallet Anda tidak mencukupi untuk melakukan pesanan ini." };
  }

  // =======================================================================
  // 2. BUAT PESANAN 
  // =======================================================================
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
        user_id: user.id,
        total_amount: cartTotal,
        status: 'Menunggu Konfirmasi',
        payment_method: 'wallet',
        paypal_order_id: `WALLET-${Date.now()}`, 
        shipping_address: shippingAddress
    })
    .select('id')
    .single();

  if (orderError || !newOrder) {
      console.error("Gagal membuat data master orders:", orderError?.message);
      return { success: false, message: "Terjadi kesalahan saat memproses pesanan di server." };
  }

  const orderId = newOrder.id;

  // 3. MASUKKAN ITEM DARI KERANJANG KE RINCIAN PESANAN
  const orderItemsToInsert = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
      product_name: item.name
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
  
  if (itemsError) {
      // Rollback (Hapus pesanan) jika gagal memasukkan rincian item
      await supabase.from('orders').delete().eq('id', orderId);
      console.error("Gagal memasukkan order_items:", itemsError.message);
      return { success: false, message: "Gagal menyimpan rincian pesanan Anda." };
  }

  // 4. KOSONGKAN KERANJANG BELANJA USER KARENA SUDAH JADI PESANAN
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  // 5. KIRIM NOTIFIKASI
  const displayId = generateDisplayIdFromCart(cartItems, orderId);

  // --> Kirim Notifikasi ke User Pembeli
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Pesanan Dibuat',
    message: `Pesanan #${displayId} berhasil dibuat dan menunggu konfirmasi. Saldo dompet akan dipotong setelah pesanan diproses oleh admin.`,
    link: `/orders/${orderId}`,
    is_read: false
  });

  // --> Kirim Notifikasi Real-time ke Semua Admin
  try {
      const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

      if (admins && admins.length > 0) {
          const customerName = profile.username || 'Pelanggan';

          const adminNotifications = admins.map(admin => ({
              user_id: admin.id,
              title: 'Pesanan Baru',
              message: `[Pesanan Baru] ${customerName} telah membuat pesanan #${displayId} menggunakan Wallet.`,
              link: `/admin/orders/${orderId}`,
              is_read: false
          }));
          
          await supabase.from('notifications').insert(adminNotifications);
      }
  } catch (adminErr) {
      console.error("Gagal mengirim notifikasi pesanan baru ke admin:", adminErr);
  }

  // 6. PERBARUI CACHE (Menggunakan aturan ESLint yang disarankan)
  revalidateTag(`orders/${user.id}`, 'max');
  revalidateTag('admin-orders', 'max');
  revalidateTag('notifications', 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { success: true, message: "Pesanan berhasil dibuat!" };
}