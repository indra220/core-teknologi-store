// src/app/orders/ConfirmDeliveryButton.tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { confirmOrderReceived } from './actions';
import NProgress from 'nprogress';
import ConfirmationModal from '@/components/ConfirmationModal';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation'; 

export default function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showNotification } = useNotification();
  const router = useRouter(); 

  const handleConfirmAction = async () => {
    setIsConfirming(true);
    NProgress.start();
    const result = await confirmOrderReceived(orderId);
    
    if (result.success) {
      showNotification(result.message, 'success');
      router.refresh(); 
    } else {
      showNotification(result.message, 'error');
    }
    
    NProgress.done();
    setIsModalOpen(false); 
    if (!result.success) {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isConfirming}
        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-95 shadow-sm shadow-emerald-500/30"
      >
        {isConfirming ? 'Memproses...' : 'Pesanan Diterima'}
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title="Pesanan Telah Tiba?"
        isProcessing={isConfirming}
        confirmText="Ya, Selesaikan Pesanan"
        cancelText="Belum"
        icon={<CheckBadgeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
      >
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Dengan menekan konfirmasi, transaksi ini akan dinyatakan <strong className="text-slate-900 dark:text-white">Selesai</strong> dan dana akan diteruskan. Pastikan produk telah Anda terima dalam kondisi baik.
        </p>
      </ConfirmationModal>
    </>
  );
}