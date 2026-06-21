// src/app/admin/page.tsx
import { getDashboardStats } from "./actions";
import type { Order } from "@/types";
import SalesChart from './SalesChart';
import { 
    BanknotesIcon, 
    ShoppingBagIcon, 
    UserGroupIcon, 
    CubeIcon,
    ArrowUpRightIcon,
    InboxStackIcon
} from '@heroicons/react/24/outline';

type RecentOrder = Pick<Order, 'id' | 'created_at' | 'total_amount' | 'profiles'>;

// --- Premium StatCard ---
const StatCard = ({ title, value, icon, trendLabel }: { title: string; value: string; icon: React.ReactNode; trendLabel?: string }) => (
    <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                {icon}
            </div>
            {trendLabel && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                    <ArrowUpRightIcon className="w-3 h-3 stroke-[3]" />
                    {trendLabel}
                </div>
            )}
        </div>
        <div className="mt-auto">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">{value}</p>
        </div>
    </div>
);

const RecentActivity = ({ orders }: { orders: RecentOrder[] }) => {
    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Aktiviti Terkini</h3>
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Transaksi Terakhir</h4>
                {orders && orders.length > 0 ? (
                    <ul className="space-y-5">
                        {orders.map(order => (
                            <li key={order.id} className="flex justify-between items-center group cursor-pointer">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200/50 dark:border-slate-700">
                                        {order.profiles?.username?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.profiles?.username || 'Pelanggan'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Membuat pembayaran</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ): (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <InboxStackIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500">Belum ada pesanan direkodkan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-10">
      
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Prestasi Perniagaan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ikhtisar harian untuk operasi kedai dalam talian anda.</p>
        </div>
        {/* Butang Eksport telah dikeluarkan dari sini */}
      </header>

      {/* Metrik Utama */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard 
            title="Pendapatan (Hari Ini)" 
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.todayRevenue)}
            icon={<BanknotesIcon className="w-5 h-5" />}
            trendLabel="+12%"
        />
        <StatCard 
            title="Pesanan (Hari Ini)" 
            value={stats.todayOrders.toString()}
            icon={<ShoppingBagIcon className="w-5 h-5" />}
            trendLabel="+5.2%"
        />
        <StatCard 
            title="Total Pelanggan" 
            value={stats.totalUsersCount.toString()}
            icon={<UserGroupIcon className="w-5 h-5" />}
        />
        <StatCard 
            title="Total Katalog Produk" 
            value={stats.totalProducts.toString()}
            icon={<CubeIcon className="w-5 h-5" />}
        />
      </section>
      
      {/* Bahagian Analitik & Aktiviti */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div>
                     <h3 className="text-base font-bold text-slate-900 dark:text-white">Analitik Jualan</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pendapatan dalam masa 30 hari kebelakangan.</p>
                 </div>
             </div>
             <div className="p-6 flex-1">
                <div className="relative h-[320px] w-full">
                    <SalesChart salesTrend={stats.salesTrend} />
                </div>
             </div>
        </div>
        
        <div className="xl:col-span-1 h-[450px] xl:h-auto">
            {/* parameter newUsersCount dikeluarkan dari pemanggilan komponen */}
            <RecentActivity orders={stats.recentOrders} />
        </div>
      </section>

    </div>
  );
}