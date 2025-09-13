// src/app/checkout/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// HAPUS: 'redirect' tidak lagi dibutuhkan di sini
// import { redirect } from "next/navigation";
import { CartItem } from "@/context/CartContext";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function createOrderFromWallet(cartItems: CartItem[]): Promise<ActionResult> {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: "Keranjang Anda kosong." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Anda harus login untuk melakukan pembayaran." };
  }
  
  const { data: lastOrder } = await supabase
    .from('orders')
    .select('shipping_address')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastOrder?.shipping_address) {
      return { success: false, message: "Alamat pengiriman tidak ditemukan. Silakan lakukan satu kali transaksi dengan PayPal terlebih dahulu untuk menyimpan alamat Anda." };
  }

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const { error } = await supabase.rpc('create_order_with_wallet', {
    user_id_in: user.id,
    cart_total: cartTotal,
    shipping_address_in: lastOrder.shipping_address,
    cart_items_in: cartItems
  });

  if (error) {
    console.error("RPC Error saat membuat pesanan dengan dompet:", error);
    const friendlyMessage = error.code === 'P0001' ? error.message : "Terjadi kesalahan saat memproses pesanan Anda.";
    return { success: false, message: friendlyMessage };
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    message: `Pesanan baru dengan pembayaran dompet berhasil dibuat dan sedang diproses.`,
    link: '/orders',
  });

  revalidatePath('/orders');
  revalidatePath('/', 'layout');
  
  // HAPUS 'redirect' dan kembalikan status sukses
  // redirect('/orders?status=success'); 
  return { success: true, message: "Pembayaran berhasil! Pesanan Anda sedang diproses." };
}