// src/app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order } from "@/types";
import OrderList from "./OrderList";

export const revalidate = 0; // Selalu ambil data terbaru

export default async function ManageOrdersPage() {
  const supabase = await createClient();

  // Ambil semua pesanan dan profil terkait, urutkan dari yang terbaru
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, user_id, profiles(username)`) // Pastikan user_id juga diambil
    .order('created_at', { ascending: false });
    
  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pesanan: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Manajemen Pesanan</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Kelola pesanan yang masuk dan perbarui status pengiriman.</p>
      </header>
      <OrderList orders={orders as unknown as Order[]} />
    </div>
  );
}