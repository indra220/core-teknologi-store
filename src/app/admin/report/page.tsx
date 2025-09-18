// src/app/admin/report/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order, Laptop } from "@/types";
import ReportClientComponent from "./ReportClientComponent";
import { unstable_cache } from "next/cache";

// Fungsi cache untuk mengambil data pesanan laporan
const getCachedAdminReports = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles ( username ), order_items ( * )`)
      .eq('status', 'Selesai')
      .order('created_at', { ascending: false });
    return { orders: data as Order[] | null, error };
  },
  ['admin-reports-data'], // Kunci cache
  {
    tags: ['admin-reports', 'orders'], // Tag revalidasi
  }
);

// Fungsi cache untuk mengambil data brand laptop
const getCachedLaptopBrands = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase.from('laptops').select('brand');
    return { laptops: data as Laptop[] | null, error };
  },
  ['laptop-brands-data'], // Kunci cache
  {
    tags: ['products'], // Tag revalidasi
  }
);

export default async function AdminReportPage() {
  const supabase = await createClient();

  // Panggil kedua fungsi cache secara terpisah
  const { orders, error: ordersError } = await getCachedAdminReports(supabase);
  const { laptops, error: laptopsError } = await getCachedLaptopBrands(supabase);

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
        allOrders={orders || []} 
        allLaptops={laptops || []} 
      />
    </div>
  );
}