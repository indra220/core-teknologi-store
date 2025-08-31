'use client'; 

import { createClient } from "@/lib/supabase/client";
// Hapus impor 'Laptop' karena tidak lagi digunakan di sini
import Link from "next/link";
import { useEffect, useState } from "react";
// Hapus impor 'Image' karena tidak lagi digunakan di sini
import { motion } from 'framer-motion';
import type { Laptop } from "@/types"; // Impor sebagai tipe jika perlu

// Komponen Ikon
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg> );
const BoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4.5 8-4.5M12 11.5V15" /></svg> );

// Varian untuk animasi stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function AdminDashboardPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [userCount, setUserCount] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { window.location.href = '/'; return; }

      const { data: laptopData } = await supabase.from('laptops').select('*').order('created_at', { ascending: false });
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      setLaptops(laptopData || []);
      setUserCount(count);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-20">Memuat dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Selamat datang, Admin! Kelola inventaris dan pengguna Anda.</p>
      </header>

      <motion.section 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Link href="/admin/report" className="block h-full">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4 h-full transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-white p-3 rounded-full shadow-sm"><BoxIcon /></div>
              <div>
                <h3 className="text-base font-semibold text-gray-500">Total Produk</h3>
                <p className="text-4xl font-extrabold text-gray-900">{laptops.length}</p>
              </div>
            </div>
          </Link>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Link href="/admin/users" className="block h-full">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4 h-full transition-transform transform hover:-translate-y-1 hover:shadow-xl">
              <div className="bg-white p-3 rounded-full shadow-sm"><UsersIcon /></div>
              <div>
                <h3 className="text-base font-semibold text-gray-500">Total Pengguna</h3>
                <p className="text-4xl font-extrabold text-gray-900">{userCount || 0}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.section>
      
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
            <p className="text-sm text-gray-500 mt-1">Tambah, edit, atau hapus produk di toko Anda.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {laptops.length > 0 ? (
            <div className="text-center py-10 text-gray-500">Tabel produk akan ditampilkan di sini.</div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="mb-4">Belum ada produk yang ditambahkan.</p>
              <Link href="/admin/products/add" className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700">
                Tambahkan Produk Pertama Anda
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}