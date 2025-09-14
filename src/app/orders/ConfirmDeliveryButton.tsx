// src/app/orders/ConfirmDeliveryButton.tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { confirmOrderReceived } from './actions';
import NProgress from 'nprogress'; // <-- Impor NProgress

export default function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { showNotification } = useNotification();

  const handleConfirm = async () => {
    if (!confirm('Apakah Anda yakin sudah menerima pesanan ini? Aksi ini akan menyelesaikan transaksi.')) {
        return;
    }
    setIsConfirming(true);
    NProgress.start(); // <-- Mulai TopLoader
    const result = await confirmOrderReceived(orderId);
    
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
      setIsConfirming(false);
    }
    NProgress.done(); // <-- Hentikan TopLoader
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isConfirming}
      className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition"
    >
      {isConfirming ? 'Mengonfirmasi...' : 'Konfirmasi Pesanan Diterima'}
    </button>
  );
}