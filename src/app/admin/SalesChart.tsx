// src/app/admin/SalesChart.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface SalesChartProps {
  salesTrend: { date: string; total: number }[];
}

export default function SalesChart({ salesTrend }: SalesChartProps) {
  const [filter, setFilter] = useState<'7d' | '1m' | '1y'>('1m');

  const filteredData = useMemo(() => {
    const now = new Date();
    return salesTrend.filter((item) => {
      const itemDate = new Date(item.date);
      if (filter === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      }
      if (filter === '1m') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return itemDate >= oneMonthAgo;
      }
      return true;
    });
  }, [salesTrend, filter]);

  const data = {
    labels: filteredData.map((t) => new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
    datasets: [{
      fill: true,
      label: 'Pendapatan',
      data: filteredData.map((t) => t.total),
      borderColor: '#4F46E5',
      backgroundColor: (context: ScriptableContext<"line">) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(79, 70, 229, 0.2)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
        return gradient;
      },
      tension: 0.4,
    }],
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end gap-2 mb-4">
        {(['7d', '1m', '1y'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filter === f 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {f === '7d' ? '7 Hari' : f === '1m' ? 'Bulan Ini' : 'Tahun Ini'}
          </button>
        ))}
      </div>
      <div className="relative flex-1 min-h-[300px]">
        <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}