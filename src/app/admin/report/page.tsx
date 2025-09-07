// src/app/admin/report/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Order, Laptop } from "@/types";
import ReportClientComponent from "./ReportClientComponent";

export const revalidate = 0;

export default async function AdminReportPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/login'); }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { redirect('/'); }

  // PERBAIKAN FINAL: Setelah Foreign Key ditambahkan, kueri sederhana ini akan berfungsi
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      profiles ( username ),
      order_items ( * )
    `)
    .order('created_at', { ascending: false });

  const { data: laptops, error: laptopsError } = await supabase
    .from('laptops')
    .select('brand');

  if (ordersError || laptopsError) {
    const errorMessage = ordersError?.message || laptopsError?.message;
    return <div className="text-center py-20 text-red-500">Gagal memuat data laporan: {errorMessage}</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Laporan & Statistik</h1>
          <p className="mt-2 text-lg text-gray-600">Ringkasan data, visualisasi, dan riwayat transaksi.</p>
        </div>
        <Link 
          href="/admin" 
          className="mt-4 sm:mt-0 bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-900 transition"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </header>
      
      <ReportClientComponent 
        allOrders={orders as Order[]} 
        allLaptops={laptops as Laptop[]} 
      />
    </div>
  );
}