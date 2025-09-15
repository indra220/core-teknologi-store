// src/app/orders/ConfirmDeliveryButton.tsx
'use client';

import { useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { confirmOrderReceived } from './actions';
import NProgress from 'nprogress';
import ConfirmationModal from '@/components/ConfirmationModal';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation'; // <-- 1. Impor useRouter

export default function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showNotification } = useNotification();
  const router = useRouter(); // <-- 2. Inisialisasi router

  const handleConfirmAction = async () => {
    setIsConfirming(true);
    NProgress.start();
    const result = await confirmOrderReceived(orderId);
    
    if (result.success) {
      showNotification(result.message, 'success');
      router.refresh(); // <-- 3. Tambahkan baris ini untuk me-refresh UI
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
        className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition"
      >
        {isConfirming ? 'Pesanan Selesai' : 'Konfirmasi Pesanan Diterima'}
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title="Konfirmasi Penerimaan Pesanan"
        isProcessing={isConfirming}
        confirmText="Ya, Sudah Diterima"
        cancelText="Batal"
        icon={<CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
      >
        <p>
          Apakah Anda yakin sudah menerima pesanan ini? Aksi ini akan menyelesaikan transaksi dan tidak dapat diurungkan.
        </p>
      </ConfirmationModal>
    </>
  );
}