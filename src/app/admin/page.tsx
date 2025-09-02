'use client';

import { createClient } from "@/lib/supabase/client";
import { Laptop } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { deleteProduct } from './actions';
import { useNotification } from "@/components/notifications/NotificationProvider";

// Komponen Ikon
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg> );
const BoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4.5 8-4.5M12 11.5V15" /></svg> );

// Varian untuk animasi stagger
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default function AdminDashboardPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [userCount, setUserCount] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

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

  const handleDelete = async (productId: string, imageUrl: string | null) => {
    if (window.confirm("Anda yakin ingin menghapus produk ini? Aksi ini tidak bisa dibatalkan.")) {
      const result = await deleteProduct(productId, imageUrl);
      showNotification(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setLaptops(prevLaptops => prevLaptops.filter(laptop => laptop.id !== productId));
      }
    }
  };

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
                <h3 className="text-base font-semibold text-gray-500">Total Produk & Laporan</h3>
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
          <Link href="/admin/products/add" className="bg-green-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-700 transition">
            + Tambah Produk
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          {laptops.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="sticky right-[200px] bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="sticky right-[100px] bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="sticky right-0 bg-gray-50 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {laptops.map((laptop: Laptop) => (
                  <tr key={laptop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          <Image src={laptop.image_url || '/placeholder.png'} alt={laptop.name} fill className="rounded-lg object-cover" sizes="48px" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{laptop.name}</div>
                          <div className="text-xs text-gray-500">{laptop.processor} / {laptop.ram} / {laptop.storage}</div>
                        </div>
                      </div>
                    </td>
                    <td className="sticky right-[200px] bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{laptop.brand}</td>
                    <td className="sticky right-[100px] bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(laptop.price)}
                    </td>
                    <td className="sticky right-0 bg-white px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link href={`/admin/products/edit/${laptop.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                      <button 
                        onClick={() => handleDelete(laptop.id, laptop.image_url)}
                        type="button" 
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="mb-4">Belum ada produk yang ditambahkan.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}