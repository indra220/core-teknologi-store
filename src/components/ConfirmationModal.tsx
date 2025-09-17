// src/components/ConfirmationModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  variant?: 'danger' | 'success'; // Varian untuk skema warna
  isProcessing?: boolean;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  variant = 'success', // Default ke 'success'
  isProcessing = false,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  icon,
  children,
}: ConfirmationModalProps) {
  
  // Skema warna berdasarkan varian
  const colorSchemes = {
    danger: {
      iconBg: 'bg-red-900/50',
      confirmButton: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400',
    },
    success: {
      iconBg: 'bg-green-900/50',
      confirmButton: 'bg-green-600 hover:bg-green-700 disabled:bg-green-400',
    }
  };
  
  const scheme = colorSchemes[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              {icon && (
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${scheme.iconBg}`}>
                  {icon}
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-50 mt-5">
                {title}
              </h3>
              <div className="mt-3 text-base text-gray-300 max-w-sm">
                {children}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full rounded-lg bg-gray-600 px-5 py-3 font-semibold text-gray-200 shadow-sm hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className={`w-full rounded-lg px-5 py-3 font-semibold text-white shadow-sm ${scheme.confirmButton} disabled:cursor-not-allowed transition-colors`}
              >
                {isProcessing ? 'Memproses...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}