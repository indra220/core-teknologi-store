// src/app/admin/orders/OrderList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Order } from "@/types";
import Link from 'next/link';
import PaginationControls from "@/components/PaginationControls";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  InboxStackIcon, 
  EyeIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Selesai': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'Dibatalkan': 
      return 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    case 'Menunggu Konfirmasi': 
      return 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'Diproses': 
    case 'Dalam Pengiriman': 
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    default: 
      return 'bg-slate-50 text-slate-600 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50';
  }
};

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
  const initialSearchTerm = searchParams.get('search') || '';
  
  const [localSearch, setLocalSearch] = useState(initialSearchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== initialSearchTerm) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (localSearch) {
          current.set('search', localSearch);
        } else {
          current.delete('search');
        }
        current.set('page', '1');
        router.push(`${pathname}?${current.toString()}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, initialSearchTerm, pathname, router, searchParams]);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col w-full overflow-hidden">
       
      <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan ID Pesanan..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800">
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                ID Pesanan
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                Pemesan
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                Produk & Varian
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 group">
                <div className="flex items-center justify-center gap-1.5">
                  Tanggal
                  <ArrowsUpDownIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <InboxStackIcon className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada pesanan</h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      {localSearch ? (
                        <span>Kami tidak dapat menemukan pesanan dengan ID &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{localSearch}</span>&quot;.</span>
                      ) : (
                        <span>Belum ada transaksi yang direkam di dalam sistem.</span>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  
                  <td className="py-4 px-6 whitespace-nowrap text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                         <InboxStackIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          #{generateDisplayId(order)}
                        </span>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(order as any).payment_method === 'paypal' && (
                            <span className="inline-block w-fit mt-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-500/20">
                                Via PayPal
                            </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 whitespace-nowrap text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {order.profiles?.full_name || order.profiles?.username || 'Tanpa Nama'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[150px]">
                        @{order.profiles?.username || 'N/A'}
                    </p>
                  </td>

                  <td className="py-4 px-6 text-left">
                    <div className="flex flex-col gap-2 min-w-[200px] max-w-[320px]">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {((order as any).order_items && (order as any).order_items.length > 0) ? (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (order as any).order_items.map((item: any, idx: number) => {
                                const varian = item.variant_name || item.variant || item.varian || item.product_variant;
                                return (
                                    <div key={idx} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                            {item.product_name || 'Produk Tidak Diketahui'} <span className="text-indigo-600 dark:text-indigo-400">(x{item.quantity})</span>
                                        </span>
                                        {varian && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Varian: <span className="font-medium text-slate-700 dark:text-slate-300">{varian}</span></span>}
                                    </div>
                                )
                            })
                        ) : (
                            <span className="text-sm text-slate-500">-</span>
                        )}
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-left">
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-left">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-left">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center gap-2 p-2 px-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-all"
                        title="Lihat Detail Pesanan"
                      >
                        <EyeIcon className="h-4 w-4 stroke-2" />
                        <span className="text-xs font-bold">Detail</span>
                      </Link>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 rounded-b-2xl">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
        />
      </div>

    </div>
  );
}