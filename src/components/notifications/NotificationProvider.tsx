'use client';

import { createContext, useState, useContext, ReactNode, useCallback } from 'react'; // 1. Impor useCallback

// Tipe untuk notifikasi
type NotificationType = 'success' | 'error' | 'info';
interface Notification {
  message: string;
  type: NotificationType;
}

// Tipe untuk context
interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

// Buat Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Buat Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  // 2. Bungkus fungsi dengan useCallback
  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
    // Notifikasi akan hilang setelah 4 detik
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []); // 3. Beri dependensi kosong agar fungsi tidak dibuat ulang

  // Logika warna berdasarkan tipe notifikasi
  const notificationStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg animate-fade-in-down z-50 ${notificationStyles[notification.type]}`}
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Buat custom hook untuk kemudahan penggunaan
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}