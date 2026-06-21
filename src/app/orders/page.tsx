// src/app/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Order } from "@/types";
import OrderClientPage from "./OrderClientPage";

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil data orders dan order_items saja 
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error.message || error);
    return (
      <div className="flex justify-center py-20">
        <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-xl border border-rose-200 text-sm font-semibold shadow-sm">
          Gagal memuat riwayat pesanan.
        </div>
      </div>
    );
  }

  type OrderItemBase = { product_id: string; [key: string]: unknown };

  // 2. Kumpulkan semua product_id unik dari item pesanan
  const productIds = Array.from(new Set(
    orders?.flatMap(order => order.order_items.map((item: OrderItemBase) => item.product_id).filter(Boolean)) || []
  ));

  // 3. Ambil data gambar langsung dari tabel laptops berdasarkan kumpulan product_id
  let laptopsMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: laptops } = await supabase
      .from('laptops')
      .select('product_id, image_url')
      .in('product_id', productIds);
      
    if (laptops) {
      laptopsMap = laptops.reduce((acc, laptop) => {
        if (laptop.product_id && laptop.image_url) {
          acc[laptop.product_id] = laptop.image_url;
        }
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // 4. Susun ulang dan gabungkan data gambar ke struktur yang dikenali OrderClientPage
  const formattedOrders = orders?.map(order => ({
    ...order,
    order_items: order.order_items.map((item: OrderItemBase) => ({
      ...item,
      products: {
        laptops: [
          { image_url: laptopsMap[item.product_id] || null }
        ]
      }
    }))
  })) as unknown as Order[];

  // PERBAIKAN: Menghapus max-w-6xl dan menggantinya dengan w-full agar mengisi ruang yang kini sudah lega
  // Komentar diletakkan di luar return agar tidak memicu error TS2304
  return (
    <div className="w-full mx-auto py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pesanan Saya</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Lacak pengiriman dan kelola semua riwayat transaksi Anda.</p>
      </header>

      <OrderClientPage allOrders={formattedOrders || []} />
    </div>
  );
}