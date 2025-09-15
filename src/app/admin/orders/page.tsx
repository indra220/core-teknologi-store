// src/app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order, OrderStatus } from "@/types"; // <-- Impor tipe OrderStatus
import OrderList from "./OrderList";

export const revalidate = 0; // Selalu ambil data terbaru

export default async function ManageOrdersPage() {
  const supabase = await createClient();

  // Ambil semua pesanan dan profil terkait
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, user_id, profiles(username)`) 
    .order('created_at', { ascending: false });
    
  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pesanan: {error.message}</div>;
  }

  // --- LOGIKA PENGURUTAN BARU ---

  // Definisikan urutan prioritas. Status 'Selesai' dan 'Dibatalkan' sekarang memiliki prioritas yang sama.
  const statusPriority: Record<OrderStatus, number> = {
    'Menunggu Konfirmasi': 1,
    'Diproses': 2,
    'Dalam Pengiriman': 3,
    'Selesai': 4,      // <-- Prioritas sama
    'Dibatalkan': 4,    // <-- Prioritas sama
  };

  // Lakukan pengurutan pada array 'orders'
  (orders as Order[]).sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;

    // Jika prioritas statusnya berbeda, urutkan berdasarkan prioritas
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Jika prioritas statusnya sama (misalnya keduanya aktif, atau keduanya selesai/dibatalkan),
    // urutkan berdasarkan tanggal (yang lebih baru di atas)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  // --- AKHIR LOGIKA PENGURUTAN ---

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