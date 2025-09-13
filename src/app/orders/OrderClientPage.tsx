// src/app/orders/OrderClientPage.tsx
'use client';

import { useState, useMemo } from 'react';
import { Order, OrderStatus } from "@/types";
import Link from "next/link";
import Image from "next/image";
import CancelOrderButton from "./CancelOrderButton";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";
import { motion, AnimatePresence } from 'framer-motion';

// --- Ikon-Ikon ---
// PERBAIKAN: Hapus TruckIcon dan CheckCircleIcon yang tidak digunakan
import { TagIcon, CalendarDaysIcon, XCircleIcon, CreditCardIcon, WalletIcon } from '@heroicons/react/24/outline';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// --- Komponen Status Badge ---
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusStyles: Record<OrderStatus, string> = {
    'Menunggu Konfirmasi': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Diproses': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Dalam Pengiriman': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    'Selesai': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Dibatalkan': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

// --- Komponen Progress Bar Visual ---
const OrderProgressBar = ({ status }: { status: OrderStatus }) => {
  const steps: OrderStatus[] = ['Menunggu Konfirmasi', 'Diproses', 'Dalam Pengiriman', 'Selesai'];
  const currentStepIndex = steps.indexOf(status);

  if (status === 'Dibatalkan') {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <XCircleIcon className="h-6 w-6" />
        <span className="font-semibold">Pesanan Dibatalkan</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        {/* PERBAIKAN: Hapus parameter 'index' yang tidak digunakan */}
        {steps.map((step) => (
          <div key={step} className="text-center text-xs text-gray-500 dark:text-gray-400" style={{ width: '25%' }}>
            {step}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};


export default function OrderClientPage({ allOrders }: { allOrders: Order[] }) {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'Semua'>('Semua');

  // PERBAIKAN: Sederhanakan logika filter untuk memperbaiki error TypeScript
  const filteredOrders = useMemo(() => {
    if (activeTab === 'Semua') return allOrders;
    return allOrders.filter(o => o.status === activeTab);
  }, [allOrders, activeTab]);

  // PERBAIKAN: Tambahkan 'Menunggu Konfirmasi' ke dalam daftar tab
  const tabs: (OrderStatus | 'Semua')[] = ['Semua', 'Menunggu Konfirmasi', 'Diproses', 'Dalam Pengiriman', 'Selesai', 'Dibatalkan'];
  
  const tabLabels: Record<OrderStatus | 'Semua', string> = {
    'Semua': 'Semua',
    'Menunggu Konfirmasi': 'Konfirmasi',
    'Diproses': 'Diproses',
    'Dalam Pengiriman': 'Dikirim',
    'Selesai': 'Selesai',
    'Dibatalkan': 'Dibatalkan'
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200 dark:border-gray-600 pb-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID Pesanan</p>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-mono flex items-center gap-2">
                      <TagIcon className="h-5 w-5 text-gray-400" />
                      {order.paypal_order_id}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 justify-start sm:justify-end">
                      <CalendarDaysIcon className="h-5 w-5" />
                      {formatDate(order.created_at)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="my-6">
                   <OrderProgressBar status={order.status} />
                </div>

                {/* Daftar Item */}
                <div className="space-y-4">
                  {order.order_items.map(item => (
                      <div key={item.id} className="flex items-center gap-4">
                          <Image src={item.products?.image_url || '/placeholder.png'} alt={item.product_name} width={64} height={64} className="h-16 w-16 rounded-lg object-cover border dark:border-gray-600"/>
                          <div className="flex-grow">
                              <p className="font-semibold text-gray-800 dark:text-gray-100">{item.product_name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                          </div>
                      </div>
                  ))}
                </div>

                {/* Footer Kartu Pesanan */}
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t border-gray-200 dark:border-gray-600 mt-6 pt-4">
                   <div className="w-full sm:w-auto text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2 font-semibold">
                            {order.payment_method === 'wallet' ? <WalletIcon className="h-5 w-5 text-green-500"/> : <CreditCardIcon className="h-5 w-5 text-blue-500"/>}
                            <span>Metode Pembayaran</span>
                        </div>
                        <p className="capitalize mt-1">{order.payment_method}</p>
                   </div>
                   <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        <p className="font-extrabold text-xl text-gray-900 dark:text-gray-50">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            {order.status === 'Menunggu Konfirmasi' && (
                            <CancelOrderButton orderId={order.id} />
                            )}
                            {order.status === 'Dalam Pengiriman' && (
                            <ConfirmDeliveryButton orderId={order.id} />
                            )}
                        </div>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Tidak Ada Pesanan</h2>
                {/* PERBAIKAN: Ganti "" dengan <strong> untuk memperbaiki error unescaped entities */}
                <p className="mt-2 text-gray-500 dark:text-gray-400">Anda tidak memiliki pesanan dengan status <strong className="font-semibold text-gray-600 dark:text-gray-300">{tabLabels[activeTab]}</strong>.</p>
                <Link href="/products" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700">
                    Mulai Belanja
                </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}