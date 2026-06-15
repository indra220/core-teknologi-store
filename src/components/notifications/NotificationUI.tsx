// src/components/notifications/NotificationUI.tsx
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// PERBAIKAN IMPOR: Pastikan clearReadNotifications dan deleteNotification dipanggil
import { markNotificationAsRead, deleteNotification, clearReadNotifications } from '@/lib/actions/notifications';
import { useNotification } from './NotificationProvider'; 

interface Notification {
  id: string;
  message: string;
  link: string | null;
  read_at?: string | null; 
  is_read?: boolean;       
  created_at: string;
}

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

const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> </svg> );
const XMarkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg> );

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
  const [isClearing, setIsClearing] = useState(false);
  
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  useOnClickOutside(notificationRef, () => setIsOpen(false));

  useEffect(() => {
    const mappedNotifications = initialNotifications.map(n => ({
        ...n,
        is_read: n.is_read || n.read_at !== null
    }));
    setNotifications(mappedNotifications);
  }, [initialNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    setIsOpen(false);
    
    await markNotificationAsRead(notification.id);
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // HANDLER: Hapus 1 Notifikasi
  const handleDeleteSingleNotification = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); 
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotification(id);
  };

  // HANDLER: Hapus Semua Terbaca
  const handleClearReadNotifications = async () => {
    setIsClearing(true);
    const result = await clearReadNotifications();
    
    if (result.success) {
      setNotifications(prev => prev.filter(n => !n.is_read));
      showNotification(result.message || "Berhasil dihapus", 'success');
    } else {
      showNotification(result.error || "Gagal menghapus", 'error');
    }
    
    setIsClearing(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasReadNotifications = notifications.some(n => n.is_read);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(prev => !prev)} 
        className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10 transition" 
        aria-label="Buka notifikasi"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
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
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border dark:border-gray-700 flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-4 font-extrabold text-lg border-b dark:border-gray-700 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800">
              Notifikasi
            </div>

            {/* LIST NOTIFIKASI */}
            <div className="max-h-[22rem] overflow-y-auto bg-white dark:bg-gray-800">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif.id} className="group flex border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      
                      <button 
                        onClick={() => handleNotificationClick(notif)} 
                        className="flex-grow text-left p-4 pr-2 focus:outline-none"
                      >
                        <p className={`text-sm leading-snug ${!notif.is_read ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {notif.message}
                        </p>
                        <p className={`text-xs mt-1.5 ${!notif.is_read ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                          {timeAgo(notif.created_at)}
                        </p>
                      </button>

                      {/* TOMBOL SILANG (X) */}
                      <div className="flex items-center justify-center pr-3 opacity-0 group-hover:opacity-100 transition focus-within:opacity-100">
                        <button 
                            onClick={(e) => handleDeleteSingleNotification(e, notif.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Hapus notifikasi"
                        >
                            <XMarkIcon />
                        </button>
                      </div>

                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi baru.</p>
                </div>
              )}
            </div>

            {/* FOOTER: Tombol Hapus Semua */}
            {hasReadNotifications && (
              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button 
                  onClick={handleClearReadNotifications}
                  disabled={isClearing}
                  className="w-full text-center text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold disabled:opacity-50 transition py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  {isClearing ? 'Menghapus...' : 'Hapus Semua yang Terbaca'}
                </button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}