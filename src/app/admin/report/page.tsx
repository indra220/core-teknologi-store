'use client'; 

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
);

// Komponen Ikon
const MoneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1.344a4.014 4.014 0 01.901-2.543 4.014 4.014 0 012.543-.901M12 6H9.01M12 6H7.5a4.5 4.5 0 00-4.5 4.5v.01M12 18v1.344a4.014 4.014 0 00-.901 2.543 4.014 4.014 0 00-2.543.901M12 18h2.99M12 18h4.5a4.5 4.5 0 004.5-4.5v-.01" /></svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4.5 8-4.5M12 11.5V15" /></svg>
);

interface StatsData {
  laptops: { brand: string }[];
}

export default function AdminReportPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { window.location.href = '/'; return; }

      const { data: laptops } = await supabase.from('laptops').select('brand');
      
      setStats({ laptops: laptops || [] });
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('realtime laptops')
      .on( 'postgres_changes', { event: '*', schema: 'public', table: 'laptops' }, (_payload) => { fetchData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="text-center py-20">Memuat data laporan...</div>;
  }

  const productBrands = stats?.laptops?.reduce((acc: { [key: string]: number }, laptop) => {
    acc[laptop.brand] = (acc[laptop.brand] || 0) + 1;
    return acc;
  }, {});

  const barChartData = {
    labels: productBrands ? Object.keys(productBrands) : [],
    datasets: [{
      label: 'Jumlah Produk per Brand',
      data: productBrands ? Object.values(productBrands) : [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  const salesReportData = {
    labels: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli'],
    datasets: [{
      label: 'Pendapatan (Juta Rp)',
      data: stats?.laptops && stats.laptops.length > 0 ? [120, 190, 150, 250, 220, 300, 280] : [0, 0, 0, 0, 0, 0, 0],
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Tren Pendapatan per Bulan', font: { size: 16 } },
    },
    scales: { y: { beginAtZero: true } }
  };
  
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Laporan & Statistik</h1>
          <p className="mt-2 text-lg text-gray-600">Ringkasan data Core Teknologi Store.</p>
        </div>
        <Link href="/admin" className="mt-4 sm:mt-0 bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-900 transition">
          &larr; Kembali ke Dashboard
        </Link>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full shadow-sm"><BoxIcon /></div>
          <div>
            <h3 className="text-base font-semibold text-gray-500">Total Produk</h3>
            <p className="text-4xl font-extrabold text-gray-900">{stats?.laptops?.length || 0}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-teal-100 p-6 rounded-2xl shadow-lg border flex items-center space-x-4">
          <div className="bg-white p-3 rounded-full shadow-sm"><MoneyIcon /></div>
          <div>
            <h3 className="text-base font-semibold text-gray-500">Pendapatan (Contoh)</h3>
            <p className="text-4xl font-extrabold text-green-600">Rp 0</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl border">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Produk per Brand</h2>
          {stats?.laptops && stats.laptops.length > 0 ? <Bar data={barChartData} /> : <p className="text-center py-10 text-gray-500">Belum ada data produk.</p>}
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl border">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Laporan Penjualan</h2>
          {stats?.laptops && stats.laptops.length > 0 ? (
            <Line options={lineChartOptions} data={salesReportData} />
          ) : (
            <p className="text-center py-10 text-gray-500">Belum ada data penjualan.</p>
          )}
        </div>
      </section>
    </div>
  );
}