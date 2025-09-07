// src/app/admin/page.tsx

import { createClient } from "@/lib/supabase/server";
import { Laptop } from "@/types";
import Link from "next/link";
import Image from 'next/image';
import { redirect } from "next/navigation";
import AdminProductList from "./ProductList"; // Komponen baru untuk sisi klien

// Komponen Ikon tetap sama
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg> );
const BoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4.5 8-4.5M12 11.5V15" /></svg> );

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  // 1. Validasi otentikasi dan peran admin di server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // 2. Ambil semua data di server
  const { data: laptopsData } = await supabase.from('laptops').select('*').order('created_at', { ascending: false });
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  const laptops = laptopsData || [];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Selamat datang, Admin! Kelola inventaris dan pengguna Anda.</p>
      </header>

      {/* Kartu Statistik */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <Link href="/admin/report" className="block h-full">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4 h-full transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-white p-3 rounded-full shadow-sm"><BoxIcon /></div>
              <div>
                <h3 className="text-base font-semibold text-gray-500">Total Produk & Laporan</h3>
                <p className="text-4xl font-extrabold text-gray-900">{laptops.length}</p>
              </div>
            </div>
          </Link>
        </div>
        <div>
          <Link href="/admin/users" className="block h-full">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4 h-full transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-white p-3 rounded-full shadow-sm"><UsersIcon /></div>
              <div>
                <h3 className="text-base font-semibold text-gray-500">Total Pengguna</h3>
                <p className="text-4xl font-extrabold text-gray-900">{userCount || 0}</p>
              </div>
            </div>
          </Link>
        </div>
      </section>
      
      {/* 3. Kirim data ke Client Component terpisah untuk interaktivitas */}
      <AdminProductList initialLaptops={laptops} />
    </div>
  );
}