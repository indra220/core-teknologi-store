// src/app/orders/CancelOrderButton.tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { cancelOrder } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSession } from '@/context/SessionContext'; // <-- IMPOR useSession

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { showNotification } = useNotification();
  const { refreshSession } = useSession(); // <-- AMBIL FUNGSI REFRESH

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    const result = await cancelOrder(orderId);
    
    if (result.success) {
      await refreshSession(); // <-- REFRESH DATA SETELAH SUKSES
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
    setIsModalOpen(false);
    // Kita set isCancelling kembali ke false setelah modal ditutup dan notif muncul
    // agar tombol bisa diklik lagi jika ada error.
    setIsCancelling(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 transition"
      >
        Batalkan Pesanan
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded-2xl shadow-xl border dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-4">
                  Konfirmasi Pembatalan
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan dan tindakan ini tidak dapat diurungkan.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCancelling}
                  className="mt-3 sm:mt-0 w-full rounded-md bg-white dark:bg-gray-700 px-4 py-2 font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="w-full rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-red-400"
                >
                  {isCancelling ? 'Memproses...' : 'Ya, Batalkan Pesanan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}