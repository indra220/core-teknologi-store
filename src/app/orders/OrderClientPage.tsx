// src/app/orders/OrderClientPage.tsx
'use client';

import { useState, useMemo } from 'react';
import { Order, OrderStatus, Product, Laptops } from "@/types";
import Link from "next/link";
import Image from "next/image";
import CancelOrderButton from "./CancelOrderButton";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";
import { motion, AnimatePresence } from 'framer-motion';

import { 
    TagIcon, 
    CalendarDaysIcon, 
    XCircleIcon, 
    CreditCardIcon, 
    WalletIcon,
    InboxStackIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

// FUNGSI GENERATOR ID TAMPILAN DINAMIS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateDisplayId = (order: any) => {
  if (!order) return 'INV-UNKNOWN';
  const date = new Date(order.created_at);
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusStyles: Record<OrderStatus, string> = {
    'Menunggu Konfirmasi': 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    'Diproses': 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    'Dalam Pengiriman': 'bg-cyan-50 text-cyan-700 border-cyan-200/50 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
    'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    'Dibatalkan': 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const OrderProgressBar = ({ status }: { status: OrderStatus }) => {
  const steps: OrderStatus[] = ['Menunggu Konfirmasi', 'Diproses', 'Dalam Pengiriman', 'Selesai'];
  const currentStepIndex = steps.indexOf(status);

  if (status === 'Dibatalkan') {
    return (
      <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20">
        <XCircleIcon className="h-5 w-5" />
        <span className="text-sm font-bold">Pesanan telah dibatalkan.</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => {
           const isActive = index <= currentStepIndex;
           return (
            <div key={step} className={`text-center text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} style={{ width: '25%' }}>
                {step}
            </div>
           )
        })}
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-indigo-500 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-700 ease-out relative" 
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        >
            <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default function OrderClientPage({ allOrders }: { allOrders: Order[] }) {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'Semua'>('Semua');

  const filteredOrders = useMemo(() => {
    if (activeTab === 'Semua') return allOrders;
    return allOrders.filter(o => o.status === activeTab);
  }, [allOrders, activeTab]);

  const tabs: (OrderStatus | 'Semua')[] = ['Semua', 'Menunggu Konfirmasi', 'Diproses', 'Dalam Pengiriman', 'Selesai', 'Dibatalkan'];
  
  const tabLabels: Record<OrderStatus | 'Semua', string> = {
    'Semua': 'Semua Transaksi',
    'Menunggu Konfirmasi': 'Konfirmasi',
    'Diproses': 'Diproses',
    'Dalam Pengiriman': 'Dikirim',
    'Selesai': 'Selesai',
    'Dibatalkan': 'Dibatalkan'
  };

  return (
    <>
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="inline-flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-out
                  ${isActive 
                    ? 'text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
                `}
              >
                {isActive && (
                    <motion.div 
                        layoutId="activeTab" 
                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                {tabLabels[tab]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shrink-0 mt-0.5">
                        <TagIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">ID Pesanan</p>
                        <Link href={`/orders/${order.id}`}>
                          <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              {generateDisplayId(order)}
                          </h2>
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                  </div>
                  
                  {/* PERBAIKAN: Tombol Lihat Detail dipindahkan ke sini, tepat di atas status */}
                  <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                    <Link 
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Lihat Detail
                        <ArrowRightIcon className="h-3.5 w-3.5 stroke-2" />
                    </Link>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                       <OrderProgressBar status={order.status} />
                    </div>

                    <div className="space-y-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {order.order_items.map((item: any) => {
                          const productsData = item.products as (Product & { laptops: Laptops | Laptops[] | null }) | null;
                          const laptopData = productsData?.laptops 
                              ? (Array.isArray(productsData.laptops) ? productsData.laptops[0] : productsData.laptops) 
                              : null;
                          const imageUrl = laptopData?.image_url || '/placeholder.png';

                          return (
                              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div className="h-16 w-16 shrink-0 relative rounded-lg border border-slate-200/70 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                                      <Image src={imageUrl} alt={item.product_name || 'Produk'} fill sizes="64px" className="object-cover"/>
                                  </div>
                                  <div className="flex-grow">
                                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.product_name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.quantity}x</span> @ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                      </p>
                                  </div>
                                  <div className="text-right hidden sm:block">
                                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                                      </p>
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                   <div className="w-full sm:w-auto text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2 mb-1">
                            {order.payment_method === 'wallet' ? <WalletIcon className="h-4 w-4 text-emerald-500"/> : <CreditCardIcon className="h-4 w-4 text-indigo-500"/>}
                            <span className="text-[11px] font-bold uppercase tracking-wider">Metode Pembayaran</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white capitalize ml-6">{order.payment_method}</p>
                   </div>
                   
                   <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-3">
                        <div className="flex justify-between sm:justify-end items-end gap-4 w-full">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:hidden">Total Akhir</p>
                            <p className="font-extrabold text-2xl text-indigo-600 dark:text-indigo-400 tracking-tight text-right">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}
                            </p>
                        </div>
                        
                        {/* Karena tombol lihat detail sudah pindah ke atas, area ini hanya akan berisi tombol aksi jika ada */}
                        {(order.status === 'Menunggu Konfirmasi' || order.status === 'Dalam Pengiriman') && (
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                {order.status === 'Menunggu Konfirmasi' && (
                                    <CancelOrderButton orderId={order.id} />
                                )}
                                {order.status === 'Dalam Pengiriman' && (
                                    <ConfirmDeliveryButton orderId={order.id} />
                                )}
                            </div>
                        )}
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <InboxStackIcon className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tidak Ada Transaksi</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Anda tidak memiliki pesanan dengan status <strong className="font-semibold text-slate-700 dark:text-slate-300">&quot;{tabLabels[activeTab]}&quot;</strong>.</p>
                <Link href="/products" className="mt-6 inline-flex bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm active:scale-95">
                    Mulai Belanja
                </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}