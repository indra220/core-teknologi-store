// src/app/admin/orders/OrderList.tsx
'use client';

import { Order } from "@/types";
import Link from "@/components/NavigationLoader"; // <-- PERBAIKAN DI SINI

// Fungsi bantuan untuk badge status
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

export default function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Tidak Ada Pesanan Aktif</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Semua pesanan sudah selesai atau belum ada pesanan baru.</p>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                      {/* --- PERUBAHAN DI SINI --- */}
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
      </div>
    </section>
  );
}