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

  const { cartItems, payPalOrderDetails } = await request.json();

  if (!cartItems || !payPalOrderDetails) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  
  const totalAmount = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
  const shippingAddress = payPalOrderDetails.purchase_units[0]?.shipping?.address;
  const payerInfo = payPalOrderDetails.payer;

  try {
    // 1. Masukkan data ke tabel 'orders'
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'Processing',
        paypal_order_id: payPalOrderDetails.id,
        shipping_address: shippingAddress,
        payer_info: payerInfo,
      })
      .select()
      .single();

    if (orderError) throw orderError;
    if (!newOrder) throw new Error("Gagal membuat pesanan.");

    // 2. Siapkan dan masukkan data ke 'order_items'
    const orderItemsData = cartItems.map((item: CartItem) => ({
      order_id: newOrder.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.name,
      product_image_url: item.image_url,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 200 });

  } catch (error: unknown) { // PERBAIKAN: Ubah 'any' menjadi 'unknown'
    console.error("Error creating order:", error);
    
    // PERBAIKAN: Tambahkan pemeriksaan tipe sebelum mengakses properti
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
    
    return NextResponse.json({ error: "Gagal menyimpan pesanan: " + errorMessage }, { status: 500 });
  }
}