// src/app/admin/report/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order, Laptop } from "@/types";
import ReportClientComponent from "./ReportClientComponent";

export const revalidate = 0;

export default async function AdminReportPage() {
  const supabase = await createClient();

  // --- Kueri diperbarui untuk hanya mengambil pesanan 'Selesai' ---
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`*, profiles ( username ), order_items ( * )`)
    .eq('status', 'Selesai') // <-- FILTER DI SINI
    .order('created_at', { ascending: false });

  const { data: laptops, error: laptopsError } = await supabase
    .from('laptops')
    .select('brand');

  if (ordersError || laptopsError) {
    return <div className="text-center py-20 text-red-500">Gagal memuat data laporan: {ordersError?.message || laptopsError?.message}</div>;
  }
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Laporan & Statistik</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Ringkasan data, visualisasi, dan riwayat transaksi yang sudah selesai.</p>
      </header>
      
      <ReportClientComponent 
        allOrders={orders as Order[]} 
        allLaptops={laptops as Laptop[]} 
      />
    </div>
  );
}