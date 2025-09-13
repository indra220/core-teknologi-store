// src/app/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Order } from "@/types";
import OrderClientPage from "./OrderClientPage"; // <-- IMPOR KOMPONEN KLIEN BARU

export const revalidate = 0; // Selalu ambil data terbaru

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, payment_method, order_items (*, products (name, image_url))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat riwayat pesanan.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Pesanan Saya</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Lacak dan kelola semua transaksi Anda di sini.</p>
      </header>

      <OrderClientPage allOrders={orders as Order[]} />
    </div>
  );
}