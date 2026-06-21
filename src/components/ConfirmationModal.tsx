// src/components/ConfirmationModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  variant?: 'danger' | 'success'; 
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
  variant = 'success',
  isProcessing = false,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  icon,
  children,
}: ConfirmationModalProps) {
  
  // Skema warna diubah dari warna standar Tailwind menjadi warna Enterprise (Slate/Emerald/Rose)
  const colorSchemes = {
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400',
      confirmButton: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95',
    },
    success: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      confirmButton: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95',
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
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="relative bg-white dark:bg-[#111827] w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              {icon && (
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border mb-6 ${scheme.iconBg}`}>
                  {/* Pastikan ikon yang dikirimkan tidak memiliki color class sendiri agar bisa mengikuti parent */}
                  <div className="h-8 w-8 [&>svg]:h-full [&>svg]:w-full">
                      {icon}
                  </div>
                </div>
              )}
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                {children}
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className={`w-full rounded-xl px-5 py-3.5 font-bold flex items-center justify-center ${scheme.confirmButton} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all`}
              >
                {isProcessing ? (
                  <span className="animate-pulse flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                  </span>
                ) : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}