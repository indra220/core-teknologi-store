// src/components/notifications/NotificationUI.tsx
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { markNotificationAsRead } from '@/lib/actions/notifications';

// Definisikan tipe data notifikasi langsung di sini
interface Notification {
  id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Hook untuk mendeteksi klik di luar elemen (tidak berubah)
function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Ikon Lonceng (tidak berubah)
const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> </svg> );

// Fungsi format waktu (tidak berubah)
const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " menit lalu";
  return "Baru saja";
};


export default function NotificationUI({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(notificationRef, () => setIsOpen(false));

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    setIsOpen(false);
    
    // Panggil Server Action (ini akan invalidate cache di server)
    await markNotificationAsRead(notification.id);
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(prev => !prev)} 
        className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" 
        aria-label="Buka notifikasi"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full">{unreadCount}</span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={notificationRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border dark:border-gray-700"
          >
            <div className="p-3 font-semibold border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">
              Notifikasi
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <button key={notif.id} onClick={() => handleNotificationClick(notif)} className="w-full text-left block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <p className={`text-sm ${!notif.is_read ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notif.message}
                    </p>
                    <p className={`text-xs mt-1 ${!notif.is_read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {timeAgo(notif.created_at)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">Tidak ada notifikasi baru.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}