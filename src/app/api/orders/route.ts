// src/app/api/orders/route.ts
import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/context/CartContext";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// FUNGSI GENERATOR ID SERAGAM
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

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { cartItems, payPalOrderDetails, localShippingAddress, paymentMethod } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Data keranjang tidak lengkap" }, { status: 400 });
    }

    const totalAmount = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
    let newOrderId = "";
    let displayId = "";

    // =======================================================================
    // LOGIKA 1: PEMBAYARAN VIA CORE WALLET
    // =======================================================================
    if (paymentMethod === 'wallet') {
        if (!localShippingAddress) {
            return NextResponse.json({ error: "Alamat pengiriman tidak lengkap" }, { status: 400 });
        }

        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
        const currentBalance = profile?.wallet_balance || 0;

        if (currentBalance < totalAmount) {
            return NextResponse.json({ error: "Saldo Core Wallet tidak mencukupi." }, { status: 400 });
        }

        const dummyPaypalId = `WALLET-${Date.now()}`;
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            user_id: user.id,
            total_amount: totalAmount,
            status: 'Menunggu Konfirmasi', 
            payment_method: 'wallet',
            shipping_address: localShippingAddress,
            paypal_order_id: dummyPaypalId
        }).select('id').single();

        if (orderError) throw orderError;
        newOrderId = orderData.id;

        const itemsToInsert = cartItems.map((item: CartItem) => ({
            order_id: newOrderId,
            product_id: item.productId,
            product_name: item.name, 
            quantity: item.quantity,
            price: item.price,
            variant_id: item.variantId
        }));
        
        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        await supabase.from('cart_items').delete().eq('user_id', user.id);

        displayId = generateDisplayIdFromCart(cartItems, newOrderId);

        // NOTIFIKASI WALLET
        await supabase.from('notifications').insert({
            user_id: user.id,
            message: `Pesanan #${displayId} berhasil dibuat dan menunggu konfirmasi. Saldo dompet akan dipotong setelah pesanan diproses oleh admin.`,
            link: `/orders/${newOrderId}`,
            read_at: null 
        });

    } 
    // =======================================================================
    // LOGIKA 2: PEMBAYARAN VIA PAYPAL
    // =======================================================================
    else {
        if (!payPalOrderDetails) {
            return NextResponse.json({ error: "Data pembayaran PayPal tidak lengkap" }, { status: 400 });
        }

        const addressToSave = localShippingAddress || payPalOrderDetails.purchase_units[0]?.shipping?.address;

        const { data: orderIdRpc, error: rpcError } = await supabase.rpc('create_full_order', {
            user_id_in: user.id,
            total_amount_in: totalAmount,
            paypal_order_id_in: payPalOrderDetails.id,
            shipping_address_in: addressToSave, 
            payer_info_in: payPalOrderDetails.payer,
            cart_items_in: cartItems,
        });

        if (rpcError) throw rpcError;
        newOrderId = orderIdRpc as string;

        displayId = generateDisplayIdFromCart(cartItems, newOrderId);

        // NOTIFIKASI PAYPAL
        await supabase.from('notifications').insert({
            user_id: user.id,
            message: `Pesanan #${displayId} (via PayPal) berhasil dibuat dan sedang diproses.`,
            link: `/orders/${newOrderId}`,
            read_at: null 
        });
    }

    // =======================================================================
    // LOGIKA GLOBAL: NOTIFIKASI ADMIN & REVALIDASI CACHE
    // =======================================================================
    try {
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        
        if (admins && admins.length > 0) {
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
            const customerName = profile?.username || 'Pelanggan';
            const methodText = paymentMethod === 'wallet' ? 'Core Wallet' : 'PayPal';

            const adminNotifications = admins.map(admin => ({
                user_id: admin.id,
                message: `[Pesanan Baru] ${customerName} telah membuat pesanan #${displayId} via ${methodText}.`,
                link: `/admin/orders/${newOrderId}`,
                read_at: null 
            }));
            
            await supabase.from('notifications').insert(adminNotifications);
        }
    } catch (adminErr) {
        console.error("Gagal mengirim notifikasi pesanan baru ke admin:", adminErr);
    }

    // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen untuk revalidateTag
    revalidateTag(`orders/${user.id}`);
    
    // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen untuk revalidateTag
    revalidateTag('notifications');
    
    // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen untuk revalidateTag
    revalidateTag('admin-orders');
    
    // @ts-expect-error: Mengabaikan tipe Next.js yang keliru meminta 2 argumen untuk revalidateTag
    revalidateTag('dashboard-stats');

    return NextResponse.json({ success: true, orderId: newOrderId }, { status: 200 });

  } catch (error: unknown) {
    console.error("Terjadi kesalahan saat membuat pesanan:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal pada server.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}