// src/components/notifications/NotificationUI.tsx
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { markNotificationAsRead, deleteNotification, clearReadNotifications } from '@/lib/actions/notifications';
import { useNotification } from './NotificationProvider'; 
// PERBAIKAN: Import supabase client untuk realtime
import { createClient } from '@/lib/supabase/client'; 

interface Notification {
  id: string;
  message: string;
  link: string | null;
  read_at?: string | null; 
  is_read?: boolean;       
  created_at: string;
  user_id?: string; // Diperlukan untuk mencocokkan realtime payload
}

function useOnClickOutside(ref: RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
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
  let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " jam lalu";
  interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " menit lalu";
  return "Baru saja";
};

export default function NotificationUI({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isClearing, setIsClearing] = useState(false);
  
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  const supabase = createClient();

  useOnClickOutside(notificationRef, () => setIsOpen(false));

  useEffect(() => {
    const mappedNotifications = initialNotifications.map(n => ({
        ...n,
        is_read: n.is_read || n.read_at !== null
    }));
    setNotifications(mappedNotifications);
  }, [initialNotifications]);

  // =======================================================================
  // PERBAIKAN: Berlangganan (Subscribe) ke Perubahan Realtime di Database
  // =======================================================================
  useEffect(() => {
    let currentUserId: string | null = null;

    const setupRealtime = async () => {
        // Ambil ID user saat ini untuk memastikan kita hanya menerima notif miliknya
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;

        const channel = supabase
            .channel('realtime-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUserId}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    
                    // Format notifikasi baru agar sesuai struktur state
                    const formattedNotification: Notification = {
                        ...newNotification,
                        is_read: newNotification.read_at !== null
                    };

                    // Tambahkan notifikasi baru ke urutan teratas tanpa menimpa yang lama
                    setNotifications(prev => [formattedNotification, ...prev]);
                    
                    // Beri tahu pengguna secara visual
                    showNotification("Anda mendapat notifikasi baru!", "info");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    setupRealtime();
    
    // Cleanup otomatis dilakukan di dalam return setupRealtime, tapi 
    // jika komponen di-unmount duluan, pastikan kita membersihkan channel-nya
    return () => {
        supabase.removeAllChannels();
    }
  }, [supabase, showNotification]);

  const handleNotificationClick = async (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    setIsOpen(false);
    await markNotificationAsRead(notification.id);
    if (notification.link) router.push(notification.link);
  };

  const handleDeleteSingleNotification = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); 
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotification(id);
  };

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
        className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" 
        aria-label="Buka notifikasi"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={unreadCount} // Animasi pop memantul setiap kali angka berubah
            className="absolute top-1 right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-[#020617]"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={notificationRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#111827] rounded-2xl shadow-xl z-50 border border-slate-200/60 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            <div className="p-4 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
              Notifikasi
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {notifications.length > 0 ? (
                <AnimatePresence>
                  {notifications.map(notif => (
                    <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="group flex border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                        <button onClick={() => handleNotificationClick(notif)} className="flex-grow text-left p-4 pr-2 focus:outline-none">
                          <p className={`text-sm leading-snug ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                            {notif.message}
                          </p>
                          <p className={`text-[11px] mt-1.5 font-semibold ${!notif.is_read ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {timeAgo(notif.created_at)}
                          </p>
                        </button>

                        <div className="flex items-center justify-center pr-3 opacity-0 group-hover:opacity-100 transition focus-within:opacity-100">
                          <button 
                              onClick={(e) => handleDeleteSingleNotification(e, notif.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition focus:outline-none"
                              title="Hapus notifikasi"
                          >
                              <XMarkIcon />
                          </button>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tidak ada notifikasi baru.</p>
                </div>
              )}
            </div>

            {hasReadNotifications && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                <button 
                  onClick={handleClearReadNotifications}
                  disabled={isClearing}
                  className="w-full text-center text-sm text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold disabled:opacity-50 transition-colors py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-95"
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