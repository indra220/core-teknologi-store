// src/app/admin/SalesChart.tsx
'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler, TooltipItem, ChartOptions } from 'chart.js'; // <-- Impor ChartOptions
import dynamic from "next/dynamic";
import { useMemo } from 'react';

// Impor dinamis untuk komponen Line chart agar hanya di-load di client
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

// Registrasi elemen-elemen yang dibutuhkan oleh Chart.js
ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler);

// Definisikan tipe data untuk props
interface SalesTrendPoint {
  date: string;
  total: number;
}

interface SalesChartProps {
  salesTrend: SalesTrendPoint[];
}

// Komponen placeholder jika tidak ada data
const ChartPlaceholder = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{message}</div>
);


export default function SalesChart({ salesTrend }: SalesChartProps) {

  // Format data agar sesuai dengan yang dibutuhkan oleh Chart.js
  const chartData = useMemo(() => {
    const labels = salesTrend.map(point => new Date(point.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
    const data = salesTrend.map(point => point.total);

    return {
      labels,
      datasets: [
        {
          label: 'Pendapatan',
          data,
          fill: true,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverRadius: 7,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        },
      ],
    };
  }, [salesTrend]);

  // --- PERBAIKAN 1: Terapkan tipe 'ChartOptions' ke objek konfigurasi ---
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            const numericValue = Number(value);
            if (numericValue >= 1000000) {
                return 'Rp ' + (numericValue / 1000000) + 'jt';
            }
            if (numericValue >= 1000) {
                return 'Rp ' + (numericValue / 1000) + 'k';
            }
            return 'Rp ' + numericValue;
          }
        }
      }
    }
  };

  if (!salesTrend || salesTrend.length === 0) {
    return <ChartPlaceholder message="Data penjualan belum cukup untuk ditampilkan." />;
  }
  
  // --- PERBAIKAN 2: Hapus 'as any' dari komponen Line ---
  return <Line options={chartOptions} data={chartData} />;
}