// src/app/admin/report/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order, Laptops } from "@/types";
import ReportClientComponent from "./ReportClientComponent";
import { unstable_cache } from "next/cache";

const getCachedAdminReports = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles ( username ), order_items ( * )`)
      .eq('status', 'Selesai')
      .order('created_at', { ascending: false });
    return { orders: data as Order[] | null, error };
  },
  ['admin-reports-data'],
  {
    tags: ['admin-reports', 'orders'],
  }
);

const getCachedLaptopBrands = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase.from('laptops').select('brand');
    return { laptops: data as Laptops[] | null, error };
  },
  ['laptop-brands-data'],
  {
    tags: ['products'],
  }
);

export default async function AdminReportPage() {
  const supabase = await createClient();

  const { orders, error: ordersError } = await getCachedAdminReports(supabase);
  const { laptops, error: laptopsError } = await getCachedLaptopBrands(supabase);

  if (ordersError || laptopsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
           <p className="font-semibold text-sm">Gagal memuat data laporan.</p>
           <p className="text-xs mt-1 opacity-80">{ordersError?.message || laptopsError?.message}</p>
         </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Laporan & Statistik</h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Ringkasan data, visualisasi, dan riwayat transaksi yang sudah selesai.
        </p>
      </header>
      
      <ReportClientComponent 
        allOrders={orders || []} 
        allLaptops={laptops || []} 
      />
    </div>
  );
}