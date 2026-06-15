// src/app/checkout/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { CartItem } from "@/context/CartContext";

type ActionResult = {
  success: boolean;
  message: string;
};

// Menambahkan tipe khusus untuk alamat
export type ShippingAddress = {
  address_line_1: string;
  admin_area_2: string;
  admin_area_1: string;
  postal_code: string;
  country_code: string;
};

export async function createOrderFromWallet(cartItems: CartItem[], shippingAddress: ShippingAddress): Promise<ActionResult> {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: "Keranjang Anda kosong." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Anda harus login untuk melakukan pembayaran." };
  }
  
  // Validasi tambahan di server untuk memastikan alamat tidak kosong
  if (!shippingAddress || !shippingAddress.address_line_1) {
      return { success: false, message: "Alamat pengiriman tidak valid atau kosong." };
  }

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const { error } = await supabase.rpc('create_order_with_wallet', {
    user_id_in: user.id,
    cart_total: cartTotal,
    // Sekarang alamat dimasukkan langsung dari form
    shipping_address_in: shippingAddress,
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

  revalidateTag(`orders/${user.id}`, 'max');
  revalidateTag('admin-orders', 'max');
  revalidateTag('notifications', 'max');
  revalidateTag('dashboard-stats', 'max');
  
  return { success: true, message: "Pembayaran berhasil! Pesanan Anda sedang diproses." };
}