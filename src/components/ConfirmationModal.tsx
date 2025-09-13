// src/components/ConfirmationModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isProcessing?: boolean;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  children: ReactNode; // Untuk deskripsi
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isProcessing = false,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  icon,
  children,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
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
              {icon && (
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 sm:mx-0 sm:h-10 sm:w-10">
                  {icon}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-4">
                {title}
              </h3>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {children}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="mt-3 sm:mt-0 w-full rounded-md bg-white dark:bg-gray-700 px-4 py-2 font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-green-400"
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