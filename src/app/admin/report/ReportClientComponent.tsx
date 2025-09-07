// src/app/admin/report/ReportClientComponent.tsx

'use client';

import { useState, useMemo, useEffect } from "react";
import { Order, Laptop } from "@/types";
import Image from "next/image";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { CubeTransparentIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import dynamic from "next/dynamic"; // 1. Impor 'dynamic'

// 2. Muat komponen Chart secara dinamis
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  ssr: false, // Jangan render di server
  loading: () => <div className="h-64 flex items-center justify-center">Memuat grafik...</div>
});

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Memuat grafik...</div>
});

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// --- Komponen & Fungsi Bantuan ---
const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// --- Komponen Utama ---
// (Sisa kode komponen tetap sama, tidak perlu diubah)
export default function ReportClientComponent({ allOrders, allLaptops }: { allOrders: Order[], allLaptops: Laptop[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  // Kalkulasi untuk Statistik
  const totalRevenue = useMemo(() => allOrders.reduce((sum, order) => sum + Number(order.total_amount), 0), [allOrders]);
  const totalProducts = allLaptops.length;

  // Proses data untuk Chart
  const brandChartData = useMemo(() => {
    const brandCounts = allLaptops.reduce((acc, laptop) => {
      acc[laptop.brand] = (acc[laptop.brand] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    return {
      labels: Object.keys(brandCounts),
      datasets: [{ label: 'Jumlah Produk per Brand', data: Object.values(brandCounts), backgroundColor: 'rgba(54, 162, 235, 0.6)' }],
    };
  }, [allLaptops]);

  const salesChartData = useMemo(() => {
    const monthlyRevenue = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    allOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate.getFullYear() === currentYear) {
        monthlyRevenue[orderDate.getMonth()] += Number(order.total_amount);
      }
    });
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      datasets: [{ label: 'Pendapatan (Juta Rp)', data: monthlyRevenue.map(rev => rev / 1000000), fill: true, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.1 }],
    };
  }, [allOrders]);
  
  // Logika untuk Riwayat Pesanan
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return allOrders;
    return allOrders.filter(order => order.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allOrders, searchTerm]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const lineChartOptions = { responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: true, text: `Tren Pendapatan Tahun ${new Date().getFullYear()}`, font: { size: 16 } } }, scales: { y: { beginAtZero: true } } };

  return (
    <>
      {/* Bagian Statistik */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full shadow-md">
            <CubeTransparentIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-500">Total Produk</h3>
            <p className="text-4xl font-extrabold text-gray-900">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-teal-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full shadow-md border border-green-200">
            <BanknotesIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-500">Total Pendapatan</h3>
            <p className="text-4xl font-extrabold text-green-700">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalRevenue)}
            </p>
          </div>
        </div>
      </section>

      {/* Bagian Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl border"><h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Produk per Brand</h2>{totalProducts > 0 ? <Bar data={brandChartData} /> : <p className="text-center py-10 text-gray-500">Belum ada data produk.</p>}</div>
        <div className="bg-white p-8 rounded-2xl shadow-xl border"><h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Laporan Penjualan</h2>{totalRevenue > 0 ? <Line options={lineChartOptions} data={salesChartData} /> : <p className="text-center py-10 text-gray-500">Belum ada data penjualan.</p>}</div>
      </section>

      {/* Bagian Riwayat Pesanan */}
      <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"><div><h2 className="text-2xl font-bold text-gray-800">Riwayat Semua Pembelian</h2><p className="text-sm text-gray-500 mt-1">Lacak semua transaksi yang terjadi di toko Anda.</p></div><div className="relative w-full sm:max-w-xs"><input type="text" placeholder="Cari berdasarkan username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500" /><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div></div></div>
        {currentOrders.length > 0 ? (<div className="space-y-6">{currentOrders.map((order) => (<div key={order.id} className="border border-gray-200 rounded-lg p-4"><div className="flex flex-wrap justify-between items-start pb-3 mb-3 border-b gap-2"><div><p className="text-sm font-semibold text-gray-500">Username: <span className="text-indigo-600 font-bold">{order.profiles?.username || 'N/A'}</span></p><p className="text-xs text-gray-500">ID Pesanan: {order.paypal_order_id}</p></div><div className="text-left sm:text-right"><p className="font-semibold text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}</p><p className="text-xs text-gray-500">{formatDate(order.created_at)}</p></div></div><div className="space-y-3">{order.order_items.map(item => (<div key={item.id} className="flex items-center gap-3 text-sm"><Image src={item.product_image_url || '/placeholder.png'} alt={item.product_name} width={40} height={40} className="h-10 w-10 rounded object-cover border"/><p className="font-semibold text-gray-700">{item.product_name}</p><p className="text-gray-500 ml-auto">{item.quantity} x</p></div>))}</div></div>))}</div>) : (<div className="text-center py-10 text-gray-500"><p>Tidak ada pesanan yang cocok dengan pencarian Anda.</p></div>)}
        {totalPages > 1 && (<div className="mt-6 flex items-center justify-between border-t pt-5"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Sebelumnya</button><span className="text-sm text-gray-700">Halaman <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span></span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Berikutnya</button></div>)}
      </section>
    </>
  );
}