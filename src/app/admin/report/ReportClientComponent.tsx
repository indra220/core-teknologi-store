'use client';

import { useState, useMemo, useEffect } from "react";
import { Order, Laptop } from "@/types";
import Image from "next/image";
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, ArcElement } from 'chart.js';
import { CubeTransparentIcon, BanknotesIcon, UsersIcon } from '@heroicons/react/24/outline';
import dynamic from "next/dynamic";
import { exportToExcel } from "@/lib/utils/export";
import NProgress from 'nprogress';

// --- Dynamic Imports for Charts ---
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, ArcElement);

// --- Helper Components & Functions ---
const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
// --- PERBAIKAN DI SINI: Komponen ExcelIcon disembunyikan/dikomentari karena tidak lagi digunakan ---
// const ExcelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M4 17h16a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

// --- Main Component ---
export default function ReportClientComponent({ allOrders, allLaptops }: { allOrders: Order[], allLaptops: Laptop[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<number>(30);
  const ordersPerPage = 5;

  const ordersInTimeRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - timeRange);
    return allOrders.filter(order => new Date(order.created_at) >= startDate);
  }, [allOrders, timeRange]);

  const stats = useMemo(() => {
    const totalRevenue = ordersInTimeRange.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const uniqueCustomers = new Set(ordersInTimeRange.map(o => o.user_id)).size;
    const totalOrders = ordersInTimeRange.length;
    return { totalRevenue, uniqueCustomers, totalOrders, totalProducts: allLaptops.length };
  }, [ordersInTimeRange, allLaptops.length]);

  const brandDistributionData = useMemo(() => {
    const brandCounts = allLaptops.reduce((acc, laptop) => {
      acc[laptop.brand] = (acc[laptop.brand] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    return {
      labels: Object.keys(brandCounts),
      datasets: [{
        label: 'Jumlah Produk',
        data: Object.values(brandCounts),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#38BDF8'],
        hoverOffset: 4
      }],
    };
  }, [allLaptops]);

  const salesTrendData = useMemo(() => {
    const trend = new Map<string, number>();
    ordersInTimeRange.forEach(order => {
      const date = formatDate(order.created_at);
      trend.set(date, (trend.get(date) || 0) + order.total_amount);
    });
    const sortedTrend = new Map([...trend.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()));
    return {
      labels: Array.from(sortedTrend.keys()),
      datasets: [{
        label: `Pendapatan Harian (${timeRange} Hari)`,
        data: Array.from(sortedTrend.values()),
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
      }],
    };
  }, [ordersInTimeRange, timeRange]);
  
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return ordersInTimeRange;
    return ordersInTimeRange.filter(order => order.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ordersInTimeRange, searchTerm]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm, timeRange]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  
  const handleExport = async (format: 'pdf' | 'excel') => {
    NProgress.start();
    const rangeText = `${timeRange} Hari Terakhir`;

    if (format === 'excel') {
      try {
        await exportToExcel(filteredOrders, rangeText);
      } catch (error) {
        console.error("Gagal mengekspor Excel:", error);
        alert("Terjadi kesalahan saat membuat file Excel.");
      } finally {
        NProgress.done();
      }
    } else {
      try {
        const params = new URLSearchParams({
          timeRange: timeRange.toString(),
          searchTerm: searchTerm,
        });
        const response = await fetch(`/api/export/pdf?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal membuat file PDF.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan_penjualan_${rangeText.replace(/ /g, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
        alert(`Gagal mengunduh PDF: ${message}`);
      } finally {
        NProgress.done();
      }
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title={`Pendapatan (${timeRange} Hari)`} value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.totalRevenue)} icon={<BanknotesIcon className="h-8 w-8 text-green-500" />} />
        <StatCard title={`Total Pesanan (${timeRange} Hari)`} value={stats.totalOrders.toString()} icon={<CubeTransparentIcon className="h-8 w-8 text-blue-500" />} />
        <StatCard title={`Pelanggan Unik (${timeRange} Hari)`} value={stats.uniqueCustomers.toString()} icon={<UsersIcon className="h-8 w-8 text-indigo-500" />} />
        <StatCard title="Total Produk" value={stats.totalProducts.toString()} icon={<CubeTransparentIcon className="h-8 w-8 text-yellow-500" />} />
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Buat Laporan Rekap</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pilih rentang waktu, lalu unduh dalam format PDF atau Excel.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[7, 14, 30].map((days) => (
                <button key={days} onClick={() => setTimeRange(days)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeRange === days ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {days} Hari
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleExport('pdf')} className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition-all transform hover:scale-105 shadow-sm border border-red-200 dark:border-red-800"><PdfIcon /> PDF</button>
              
              {/* --- Tombol Excel disembunyikan sementara dengan cara dikomentari --- */}
              {/* <button 
                onClick={() => handleExport('excel')} 
                disabled
                className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-lg shadow-sm border border-green-200 dark:border-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fitur ini sedang dalam pengembangan"
              >
                <ExcelIcon /> Excel
              </button> */}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Tren Pendapatan</h2>
          <div className="relative h-80 md:h-96">
            {stats.totalOrders > 0 ? (
              <Line data={salesTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <ChartPlaceholder message="Data penjualan belum cukup." />
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Distribusi Brand</h2>
          <div className="relative h-80 md:h-96">
            {stats.totalProducts > 0 ? (
              <Doughnut data={brandDistributionData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <ChartPlaceholder message="Belum ada data produk." />
            )}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"><div><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Riwayat Pembelian ({timeRange} Hari)</h2><p className="text-sm text-gray-500 mt-1">Menampilkan {filteredOrders.length} transaksi terakhir.</p></div><div className="relative w-full sm:max-w-xs"><input type="text" placeholder="Cari username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" /><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div></div></div>
        {currentOrders.length > 0 ? (<div className="space-y-4">{currentOrders.map((order) => (<OrderRow key={order.id} order={order} />))}</div>) : (<div className="text-center py-10 text-gray-500"><p>Tidak ada pesanan yang cocok dengan kriteria Anda.</p></div>)}
        {totalPages > 1 && (<div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-5"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Sebelumnya</button><span className="text-sm text-gray-700 dark:text-gray-300">Halaman <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span></span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Berikutnya</button></div>)}
      </section>
    </>
  );
}

// --- Sub-Components ---
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-4 overflow-hidden">
        <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-3 rounded-full">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-gray-100 whitespace-nowrap truncate">{value}</p>
        </div>
    </div>
);
const ChartPlaceholder = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{message}</div>
);
const OrderRow = ({ order }: { order: Order }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
    <div className="flex flex-wrap justify-between items-start gap-2">
      <div>
        <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">{order.paypal_order_id}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">oleh <span className="font-medium text-indigo-600 dark:text-indigo-400">{order.profiles?.username || 'N/A'}</span> pada {formatDate(order.created_at)}</p>
      </div>
      <div className="text-left sm:text-right">
        <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{order.status}</p>
      </div>
    </div>
    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 space-y-2">
      {order.order_items.map(item => (
        <div key={item.id} className="flex items-center gap-3 text-sm">
          <Image src={item.product_image_url || '/placeholder.png'} alt={item.product_name} width={32} height={32} className="h-8 w-8 rounded object-cover border dark:border-gray-600"/>
          <p className="font-semibold text-gray-700 dark:text-gray-300 flex-grow">{item.product_name}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">{item.quantity} unit</p>
        </div>
      ))}
    </div>
  </div>
);