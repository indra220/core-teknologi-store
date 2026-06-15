// src/app/api/orders/route.ts

import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/context/CartContext";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak terautentikasi" }, { status: 401 });
  }

  // 1. TANGKAP localShippingAddress DARI BODY REQUEST
  const { cartItems, payPalOrderDetails, localShippingAddress } = await request.json();

  if (!cartItems || cartItems.length === 0 || !payPalOrderDetails) {
    return NextResponse.json({ error: "Data keranjang atau pembayaran tidak lengkap" }, { status: 400 });
  }

  try {
    // 2. PRIORITASKAN ALAMAT LOKAL
    // Jika user mengisi form alamat, gunakan localShippingAddress.
    // Jika tidak ada, baru pakai alamat bawaan PayPal sebagai cadangan terakhir.
    const addressToSave = localShippingAddress || payPalOrderDetails.purchase_units[0]?.shipping?.address;

    const { data: newOrderId, error: rpcError } = await supabase.rpc('create_full_order', {
      user_id_in: user.id,
      total_amount_in: cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0),
      paypal_order_id_in: payPalOrderDetails.id,
      shipping_address_in: addressToSave, // <-- Masukkan ke sini!
      payer_info_in: payPalOrderDetails.payer,
      cart_items_in: cartItems,
    });

    if (rpcError) throw rpcError;

    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        message: `Pesanan #${payPalOrderDetails.id.substring(0, 8)} berhasil dibuat dan sedang diproses.`,
        link: '/orders',
      });

    return NextResponse.json({ success: true, orderId: newOrderId }, { status: 200 });

  } catch (error: unknown) {
    console.error("Terjadi kesalahan saat membuat pesanan:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal pada server.";
    return NextResponse.json({ error: "Gagal menyimpan pesanan: " + errorMessage }, { status: 500 });
  }
}