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
    return <div className="text-center py-10 text-red-500">Gagal memuat riwayat pesanan.</div>;
  }

  // PERBAIKAN TYPESCRIPT: Membuat tipe dasar pengganti 'any'
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
      // Membuat struktur tiruan (mock) yang cocok dengan ekspektasi TypeScript di Client Page
      products: {
        laptops: [
          { image_url: laptopsMap[item.product_id] || null }
        ]
      }
    }))
  })) as unknown as Order[];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Pesanan Saya</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Lacak dan kelola semua transaksi Anda di sini.</p>
      </header>

      <OrderClientPage allOrders={formattedOrders || []} />
    </div>
  );
}