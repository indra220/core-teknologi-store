// src/app/admin/report/ReportClientComponent.tsx
'use client';

import { useState, useMemo, useEffect } from "react";
import { Order, Laptops } from "@/types";
import Image from "next/image";
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, ArcElement, Filler } from 'chart.js';
import {  
    BanknotesIcon, 
    UsersIcon, 
    MagnifyingGlassIcon,
    DocumentArrowDownIcon,
    InboxStackIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';
import dynamic from "next/dynamic";
import { exportToExcel } from "@/lib/utils/export";
import NProgress from 'nprogress';

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, ArcElement, Filler);

// FUNGSI GENERATOR ID SERAGAM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateDisplayId = (order: any) => {
    if (!order) return 'INV-UNKNOWN';
    const date = new Date(order.created_at || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;
    
    const firstItem = order.order_items?.[0];
    const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalQty = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
    const uniqueTail = order.id ? order.id.split('-')[0].substring(0, 4).toUpperCase() : 'XXXX';
    
    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const StatCard = ({ title, value, icon, colorClass, iconClass }: { title: string, value: string, icon: React.ReactNode, colorClass: string, iconClass: string }) => (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 flex flex-col relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity ${iconClass}`}>
            {icon}
        </div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center border ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            </div>
        </div>
        <div className="relative z-10">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
    </div>
);

export default function ReportClientComponent({ allOrders, allLaptops }: { allOrders: Order[], allLaptops: Laptops[] }) {
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
        backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#0EA5E9'],
        borderWidth: 0,
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
        label: `Pendapatan Harian`,
        data: Array.from(sortedTrend.values()),
        fill: true,
        borderColor: '#4F46E5', // Indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#4F46E5',
        borderWidth: 2,
      }],
    };
  }, [ordersInTimeRange]);
  
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return ordersInTimeRange;
    return ordersInTimeRange.filter(order => order.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [ordersInTimeRange, searchTerm]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm, timeRange]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
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
        <StatCard 
            title="Pendapatan" 
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalRevenue)} 
            icon={<BanknotesIcon className="h-6 w-6" />} 
            colorClass="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
            iconClass="text-emerald-600"
        />
        <StatCard 
            title="Pesanan Selesai" 
            value={stats.totalOrders.toString()} 
            icon={<InboxStackIcon className="h-6 w-6" />} 
            colorClass="bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
            iconClass="text-indigo-600"
        />
        <StatCard 
            title="Pelanggan Aktif" 
            value={stats.uniqueCustomers.toString()} 
            icon={<UsersIcon className="h-6 w-6" />} 
            colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
            iconClass="text-blue-600"
        />
        <StatCard 
            title="Total Produk" 
            value={stats.totalProducts.toString()} 
            icon={<ShoppingBagIcon className="h-6 w-6" />} 
            colorClass="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
            iconClass="text-amber-600"
        />
      </section>

      <section className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Laporan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unduh data transaksi dalam rentang waktu terpilih.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            {[7, 14, 30].map((days) => (
              <button 
                key={days} 
                onClick={() => setTimeRange(days)} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    timeRange === days 
                    ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {days} Hari
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => handleExport('pdf')} 
                className="flex items-center justify-center px-4 py-2 bg-rose-50 text-rose-700 font-semibold rounded-xl hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all shadow-sm border border-rose-200/50 dark:border-rose-500/20 text-sm"
            >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2 stroke-2" /> PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Tren Pendapatan ({timeRange} Hari)</h2>
          <div className="relative flex-1 min-h-[300px]">
            {stats.totalOrders > 0 ? (
              <Line data={salesTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <ChartPlaceholder message="Data penjualan belum cukup untuk rentang waktu ini." />
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 text-center">Distribusi Kategori/Brand</h2>
          <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
            {stats.totalProducts > 0 ? (
              <Doughnut data={brandDistributionData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} />
            ) : (
              <ChartPlaceholder message="Belum ada data produk." />
            )}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Riwayat Transaksi</h2>
                <p className="text-sm text-slate-500 mt-1">Menampilkan {filteredOrders.length} transaksi dalam rentang waktu terpilih.</p>
            </div>
            <div className="relative w-full sm:w-80">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari berdasarkan username..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                />
            </div>
        </div>
        
        <div className="p-5 sm:p-6 bg-slate-50/30 dark:bg-slate-800/10">
            {currentOrders.length > 0 ? (
                <div className="space-y-4">
                    {currentOrders.map((order) => (<OrderRow key={order.id} order={order} />))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <InboxStackIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">Tidak ada pesanan yang cocok dengan kriteria Anda.</p>
                </div>
            )}
        </div>

        {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111827]">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Halaman <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> dari <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Sebelumnya
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Selanjutnya
                    </button>
                </div>
            </div>
        )}
      </section>
    </>
  );
}

const ChartPlaceholder = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-medium">{message}</div>
);

const OrderRow = ({ order }: { order: Order }) => (
  <div className="bg-white dark:bg-[#1E293B] border border-slate-200/60 dark:border-slate-700 rounded-xl p-5 transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200/50 dark:border-slate-700">
            {(order.profiles?.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
            {/* PERBAIKAN: Menampilkan ID Seragam pada Laporan */}
            <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">#{generateDisplayId(order)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">oleh <span className="font-semibold text-slate-700 dark:text-slate-300">@{order.profiles?.username || 'N/A'}</span> • {formatDate(order.created_at)}</p>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <p className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}</p>
        <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                {order.status}
            </span>
        </div>
      </div>
    </div>
    <div className="border-t border-slate-100 dark:border-slate-700/50 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {order.order_items.map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <Image src={item.product_image_url || '/placeholder.png'} alt={item.product_name} width={36} height={36} className="h-9 w-9 rounded-md object-cover border border-slate-200 dark:border-slate-600"/>
          <div className="flex-grow min-w-0">
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate">{item.product_name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{item.quantity} unit</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);