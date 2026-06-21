// src/components/notifications/NotificationProvider.tsx
'use client';

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

type NotificationType = 'success' | 'error' | 'info';
interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Desain Enterprise: Latar belakang agak transparan (backdrop-blur) dengan border tipis
  const notificationStyles = {
    success: {
        bg: 'bg-emerald-50/95 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400',
        icon: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
    },
    error: {
        bg: 'bg-rose-50/95 dark:bg-rose-500/10 border-rose-200/60 dark:border-rose-500/20 text-rose-800 dark:text-rose-400',
        icon: <XCircleIcon className="h-5 w-5 text-rose-500" />
    },
    info: {
        bg: 'bg-indigo-50/95 dark:bg-indigo-500/10 border-indigo-200/60 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-400',
        icon: <InformationCircleIcon className="h-5 w-5 text-indigo-500" />
    },
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border animate-fade-in-down z-[999] flex items-center gap-3 font-semibold text-sm max-w-sm w-max ${notificationStyles[notification.type].bg}`}
        >
          {notificationStyles[notification.type].icon}
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}