// src/components/Header.tsx
'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Product as Laptop } from '@/types';
// --- 1. IMPOR FUNGSI BARU ---
import { markNotificationAsRead, deleteNotification } from '@/lib/actions/notifications';
import { useNotification } from './notifications/NotificationProvider'; // Impor useNotification

// --- Tipe Data ---
interface ProfileInfo {
  full_name: string | null;
  role: string;
}

interface Notification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// Hook
function useOnClickOutside( ref: RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
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

const Cart = dynamic(() => import('./Cart'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/60 z-50 flex justify-end items-center pr-4"><p className="text-white">Memuat Keranjang...</p></div>
});

// Ikon-ikon
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> </svg> );
const CartIcon = () => ( <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> );
const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> </svg> );
// --- 2. Tambahkan Ikon 'X' Kecil untuk Tombol Hapus ---
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;


const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " jam lalu";
  interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " menit lalu";
  return "Baru saja";
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Laptop[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Laptop[]>([]);
  
  const { cartCount } = useCart();
  const { showNotification } = useNotification();
  const router = useRouter();
  const supabase = createClient();
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(notificationRef, () => setIsNotificationOpen(false));
  useOnClickOutside(userDropdownRef, () => setIsDropdownOpen(false));

  useEffect(() => {
    const fetchSessionData = async (sessionUser: User | null) => {
      if (sessionUser) {
        setUser(sessionUser);

        const { data: profileData } = await supabase.from('profiles').select('full_name, role').eq('id', sessionUser.id).single();
        setProfile(profileData);

        const { data: notificationData } = await supabase.from('notifications').select('*').eq('user_id', sessionUser.id).order('created_at', { ascending: false });
        setNotifications(notificationData || []);
      } else {
        setUser(null);
        setProfile(null);
        setNotifications([]);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionData(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);


  const handleNotificationClick = async (notification: Notification) => {
    setIsNotificationOpen(false);
    const result = await markNotificationAsRead(notification.id);

    if (result.success && result.notifications) {
      setNotifications(result.notifications);
    } else {
      console.error("Gagal menandai notifikasi sebagai terbaca:", result.error);
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // --- 3. BUAT FUNGSI BARU UNTUK MENANGANI PENGHAPUSAN ---
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Mencegah navigasi saat tombol hapus diklik

    // Optimistic UI Update: hapus notifikasi dari state secara langsung
    setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== notificationId));

    // Panggil server action
    const result = await deleteNotification(notificationId);
    
    // Jika gagal, tampilkan error dan sinkronkan kembali state dengan server
    if (!result.success) {
        showNotification(result.error || "Gagal menghapus notifikasi", "error");
        // Update state dengan data terbaru dari server untuk memastikan konsistensi
        if(result.notifications) {
          setNotifications(result.notifications);
        }
    }
  };
  
  const unreadCount = notifications.filter(n => n.read_at === null).length;
  
  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 10); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
        const { data } = await supabase.from('products').select(`*, product_variants(*)`).returns<Laptop[]>();
        if (data) setAllProducts(data);
    };
    fetchAllProducts();
  }, [supabase]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestedProducts(filtered.slice(0, 5));
    } else {
      setSuggestedProducts([]);
    }
  }, [searchQuery, allProducts]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/?message=logout_success');
  };

  const displayName = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === 'admin';
  const profileLink = isAdmin ? "/admin" : "/profile";
  const headerClasses = isScrolled ? 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700' : 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700';
  
  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${headerClasses}`}>
        <nav className="container mx-auto flex justify-between items-center p-5"> 
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center space-x-4">
              <Image src="/images/Logo-core.png" alt="Core Teknologi Logo" width={64} height={64} className="h-16 w-16" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">Core Teknologi</span>
            </Link>
            <div className="hidden md:flex items-center">
              <Link href="/products" className="text-lg font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Produk</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-800 dark:text-gray-200">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka pencarian">
                <SearchIcon />
            </button>
            
            {user && profile ? (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka keranjang">
                  <CartIcon />
                  {cartCount > 0 && (<span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-red-100 bg-red-600 rounded-full">{cartCount}</span>)}
                </button>

                <div className="relative">
                  <button onClick={() => { setIsNotificationOpen(prev => !prev); setIsDropdownOpen(false); }} className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka notifikasi" >
                    <BellIcon />
                    {unreadCount > 0 && (<span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full">{unreadCount}</span>)}
                  </button>
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div ref={notificationRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 border dark:border-gray-700" >
                        <div className="p-3 font-semibold border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">Notifikasi</div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(notif => {
                              const isUnread = notif.read_at === null;
                              return (
                                // --- 4. PERBARUI STRUKTUR JSX NOTIFIKASI ---
                                <div key={notif.id} className="relative group w-full border-b dark:border-gray-700 last:border-b-0">
                                  <button onClick={() => handleNotificationClick(notif)} className="w-full text-left block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <p className={`text-sm pr-6 ${isUnread ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{notif.message}</p>
                                    <p className={`text-xs mt-1 ${isUnread ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{timeAgo(notif.created_at)}</p>
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    title="Hapus notifikasi"
                                  >
                                    <CloseIconSmall />
                                  </button>
                                </div>
                              );
                            })
                          ) : (<p className="text-sm text-gray-500 text-center py-10">Tidak ada notifikasi baru.</p>)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button onClick={() => { setIsDropdownOpen(prev => !prev); setIsNotificationOpen(false); }} className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="User Menu" >
                    <UserIcon />
                  </button>
                  <AnimatePresence>
                    {isDropdownOpen && (
                       <motion.div ref={userDropdownRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700" >
                         <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">Halo, {displayName}</div>
                         <Link href={profileLink} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{isAdmin ? 'Dashboard' : 'Profil Saya'}</Link>
                         {!isAdmin && (<Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Pesanan Saya</Link>)}
                         <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">Logout</button>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka keranjang"><CartIcon /></button>
                <Link href="/login" className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Login atau Register"><UserIcon /></Link>
              </>
            )}
          </div>
        </nav>
      </header>
      {isCartOpen && <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
      
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-sm flex justify-center items-start pt-20"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <form action="/products" method="GET" onSubmit={() => setIsSearchOpen(false)}>
                  <input
                      type="text"
                      name="search"
                      placeholder="Cari produk di Core Teknologi..."
                      className="w-full py-4 pl-6 pr-12 text-lg bg-transparent border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                  />
                  <button type="submit" className="absolute top-0 right-0 h-full flex items-center pr-5" aria-label="Cari">
                      <SearchIcon />
                  </button>
              </form>

              {suggestedProducts.length > 0 && (
                <div className="border-t dark:border-gray-700 mt-2 pt-2">
                    <ul className="max-h-80 overflow-y-auto">
                        {suggestedProducts.map(product => (
                            <li key={product.id}>
                                <Link href={`/laptop/${product.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                                    <Image src={product.image_url || '/placeholder.png'} alt={product.name} width={48} height={48} className="w-12 h-12 object-cover rounded-md" />
                                    <div className="ml-4">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.brand}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </motion.div>
             <button onClick={() => setIsSearchOpen(false)} className="absolute top-5 right-5 text-white hover:text-gray-300" aria-label="Tutup pencarian">
                <CloseIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}