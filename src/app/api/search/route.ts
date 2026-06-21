// src/app/api/search/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q');

      // Minimal 2 huruf agar lebih responsif
      if (!query || query.length < 2) {
          return NextResponse.json({ products: [], orders: [] });
      }

      const supabase = await createClient();
      
      // 1. Cek Sesi Pengguna secara aman
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Tarik Data Katalog Produk
      // PERBAIKAN: Kita langsung mencari ke tabel 'laptops' karena kolom 'name' dan 'brand' ada di sana
      const { data: laptopsData, error: laptopError } = await supabase
          .from('laptops')
          .select('product_id, name, brand, image_url')
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
          .limit(5);

      if (laptopError) {
          console.error("Search Laptops Error:", laptopError.message);
      }

      // Format data agar sesuai dengan yang diharapkan oleh komponen Header.tsx
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedProducts = laptopsData?.map((laptop: any) => ({
          id: laptop.product_id, // Menggunakan product_id agar saat diklik langsung mengarah ke halaman yang tepat
          name: laptop.name,
          brand: laptop.brand,
          image_url: laptop.image_url || '/placeholder.png'
      })) || [];

      // 3. Tarik Data Pesanan (KHUSUS UNTUK USER LOGIN)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let orders: any[] = [];
      
      if (user) {
          const { data: orderData } = await supabase
              .from('orders')
              .select(`
                  id,
                  paypal_order_id,
                  created_at,
                  status,
                  order_items (product_name, quantity)
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

          if (orderData) {
              const q = query.toLowerCase();
              
              orders = orderData.filter(order => {
                  const paypalId = (order.paypal_order_id || '').toLowerCase();
                  const orderIdStr = (order.id || '').toLowerCase();
                  
                  // Rekonstruksi ID Tampilan Seragam
                  const date = new Date(order.created_at);
                  const yy = date.getFullYear().toString().slice(-2);
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  const dStr = `${yy}${mm}${dd}`;
                  
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const firstItem = order.order_items?.[0] as any;
                  const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toLowerCase() : 'p';
                  
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const totalQty = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
                  const uniqueTail = order.id ? order.id.split('-')[0].substring(0, 4).toLowerCase() : 'xxxx';
                  
                  const displayId = `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
                  
                  // Mencari kecocokan berdasarkan nama produk yang ada di dalam keranjang pesanan
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const hasMatchingProduct = order.order_items?.some((item: any) => 
                      (item.product_name || '').toLowerCase().includes(q)
                  );

                  return paypalId.includes(q) || orderIdStr.includes(q) || displayId.includes(q) || hasMatchingProduct;
              }).slice(0, 3); // Batasi hasil pesanan maksimal 3 agar dropdown tidak terlalu panjang
          }
      }

      // 4. Kirim respons gabungan ke Frontend
      return NextResponse.json({ products: formattedProducts, orders });

  } catch (error: unknown) {
      console.error("Search API Exception:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}