// src/app/admin/page.tsx
import { getDashboardStats } from "./actions";
import type { Order } from "@/types";
import SalesChart from './SalesChart'; // <-- Impor komponen chart baru

// Definisikan tipe data yang lebih spesifik agar cocok dengan data dari actions.ts
type RecentOrder = Pick<Order, 'id' | 'created_at' | 'total_amount' | 'profiles'>;

// --- Ikon ---
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4a2 2 0 000-4H8a2 2 0 000 4h4v1M12 18V9" /></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" /></svg> );
const BoxIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4.5 8-4.5M12 11.5V15" /></svg> );

// --- Komponen StatCard yang Diperbarui ---
const StatCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode; }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-4 overflow-hidden">
        <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-3 rounded-full">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">{title}</p>
            {/* --- PEMBARUAN DI SINI --- */}
            <p className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


const RecentActivity = ({ orders, newUsersCount }: { orders: RecentOrder[], newUsersCount: number }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">5 Pesanan Terakhir</h4>
                    {orders && orders.length > 0 ? (
                         <ul className="mt-2 space-y-2">
                             {orders.map(order => (
                                <li key={order.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-800 dark:text-gray-200">{order.profiles?.username || 'Pelanggan'}</span>
                                    <span className="font-semibold text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}</span>
                                </li>
                             ))}
                         </ul>
                    ): (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Belum ada pesanan.</p>
                    )}
                </div>
                 <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Pengguna Baru (30 Hari)</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{newUsersCount}</p>
                 </div>
            </div>
        </div>
    );
};

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Ringkasan aktivitas toko Anda.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Pendapatan Hari Ini" 
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.todayRevenue)}
            icon={<DollarSignIcon />}
        />
        <StatCard 
            title="Pesanan Hari Ini" 
            value={stats.todayOrders.toString()}
            icon={<ShoppingCartIcon />}
        />
        <StatCard 
            title="Total Pengguna" 
            value={stats.totalUsersCount.toString()}
            icon={<UsersIcon />}
        />
        <StatCard 
            title="Total Produk" 
            value={stats.totalProducts.toString()}
            icon={<BoxIcon />}
        />
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Statistik Penjualan (30 Hari Terakhir)</h3>
             {/* --- PERUBAHAN DI SINI: Placeholder diganti dengan komponen chart --- */}
             <div className="relative h-80">
                <SalesChart salesTrend={stats.salesTrend} />
             </div>
        </div>
        <div className="lg:col-span-1">
            <RecentActivity orders={stats.recentOrders} newUsersCount={stats.newUsersCount} />
        </div>
      </section>
    </div>
  );
}