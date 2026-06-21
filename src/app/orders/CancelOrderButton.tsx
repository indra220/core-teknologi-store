// src/app/orders/CancelOrderButton.tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { cancelOrder } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/context/SessionContext';
import NProgress from 'nprogress'; 
import { useRouter } from 'next/navigation'; 

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { showNotification } = useNotification();
  const { refreshSession } = useSession();
  const router = useRouter(); 

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    NProgress.start(); 
    
    const result = await cancelOrder(orderId);
    
    if (result.success) {
      if (refreshSession) await refreshSession(); 
      showNotification(result.message, 'success');
      router.refresh(); 
    } else {
      showNotification(result.message, 'error');
    }
    
    NProgress.done(); 
    setIsModalOpen(false);
    setIsCancelling(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95 shadow-sm"
      >
        Batalkan Pesanan
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-[#111827] w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 mb-4">
                    <ExclamationTriangleIcon className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Konfirmasi Pembatalan
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan pesanan ini? Saldo Anda akan dikembalikan secara otomatis ke Core Wallet.
                </p>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCancelling}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Tidak, Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="w-full rounded-xl bg-rose-600 px-4 py-3 font-bold text-white shadow-md hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  {isCancelling ? <span className="animate-pulse">Memproses...</span> : 'Ya, Batalkan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}