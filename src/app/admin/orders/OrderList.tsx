// src/app/admin/orders/OrderList.tsx
'use client';

import { Order } from "@/types";
import Link from "@/components/NavigationLoader";
import PaginationControls from "@/components/PaginationControls"; // <-- Impor
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// ... (getStatusBadgeColor tidak berubah) ...
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
    case 'Diproses': return 'bg-blue-100 text-blue-800';
    case 'Dalam Pengiriman': return 'bg-cyan-100 text-cyan-800';
    case 'Selesai': return 'bg-green-100 text-green-800';
    case 'Dibatalkan': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

interface OrderListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  itemsPerPage: number;
}

export default function OrderList({ orders, currentPage, totalPages, totalOrders, itemsPerPage }: OrderListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const handleSearch = (term: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (term) {
      current.set('search', term);
    } else {
      current.delete('search');
    }
    current.set('page', '1');
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  return (
    <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Daftar Pesanan</h2>
        <div className="relative w-full sm:max-w-xs">
          <input 
            type="text" 
            placeholder="Cari ID Pesanan / Username..."
            defaultValue={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Tidak Ada Pesanan</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Tidak ada pesanan yang cocok dengan kriteria Anda.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* ... (thead tidak berubah) ... */}
            <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID Pesanan & Pengguna</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          <div className="font-mono font-semibold">{order.paypal_order_id}</div>
                          <div className="text-xs text-gray-500">Oleh: {order.profiles?.username || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-50">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Link 
                          href={`/admin/orders/${order.id}`} 
                          className="inline-block px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Lihat Detail
                        </Link>
                      </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
      />
    </section>
  );
}