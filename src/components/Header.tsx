// src/components/Header.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, RefObject } from 'react';
import Link from '@/components/NavigationLoader';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Product as Laptop } from '@/types';
import { markNotificationAsRead, deleteNotification } from '@/lib/actions/notifications';
import { useSession } from '@/context/SessionContext';
import NProgress from 'nprogress';

// ... (kode ikon dan helper tidak berubah) ...
interface Notification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}
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
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> </svg> );
const CartIcon = () => ( <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> );
const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> </svg> );
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;
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
    const { user, profile, notifications, refreshSession } = useSession();
    const pathname = usePathname();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<Laptop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { cartCount } = useCart();
  const router = useRouter();
  const supabase = createClient();
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(notificationRef, () => setIsNotificationOpen(false));
  useOnClickOutside(userDropdownRef, () => setIsDropdownOpen(false));

  const handleNotificationClick = async (notification: Notification) => {
    setIsNotificationOpen(false);
    
    if (notification.link) {
        NProgress.start(); 
        router.push(notification.link);
    }
    
    await markNotificationAsRead(notification.id);
    await refreshSession();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); 
    await deleteNotification(notificationId);
    await refreshSession();
  };
  
  const unreadCount = notifications.filter(n => n.read_at === null).length;
  
  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 10); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 3) {
        setSuggestedProducts([]);
        return;
      }
      setIsSearching(true);
      const response = await fetch(`/api/search?q=${searchQuery}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedProducts(data);
      }
      setIsSearching(false);
    };

    const debounceTimeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);


  const handleLogout = async () => {
    setIsDropdownOpen(false);
    NProgress.start();
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('userRole');
    await supabase.auth.signOut();
    // --- PERBAIKAN DI SINI ---
    // Gunakan window.location untuk memaksa hard refresh
    window.location.assign('/login?message=logout_success');
  };

  const displayName = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === 'admin';
  const headerClasses = isScrolled ? 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700' : 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700';

  if (pathname === '/reset-password') {
    return null;
  }

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${headerClasses}`}>
        <nav className="container mx-auto flex justify-between items-center p-5"> 
          <div className="flex items-center space-x-10">
            <Link href={isAdmin ? "/admin" : "/"} className="flex items-center space-x-4">
              <Image src="/images/Logo-core.png" alt="Core Teknologi Logo" width={64} height={64} className="h-16 w-16" />
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">Core Teknologi</span>
            </Link>
            {!isAdmin && (
              <div className="hidden md:flex items-center">
                <Link href="/products" className="text-lg font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Produk</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-800 dark:text-gray-200">
            {!isAdmin && (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka pencarian">
                    <SearchIcon />
                </button>
            )}
            
            {user && profile ? (
              <>
                {!isAdmin && (
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka keranjang">
                    <CartIcon />
                    {cartCount > 0 && (<span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-red-100 bg-red-600 rounded-full">{cartCount}</span>)}
                    </button>
                )}

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
                       <motion.div ref={userDropdownRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700" >
                         <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">Halo, {displayName}</div>
                         {isAdmin ? (
                            <>
                                <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                                    <span>Logout</span>
                                </button>
                            </>
                         ) : (
                            <>
                                <div className="px-4 py-3 border-b dark:border-gray-600">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <WalletIcon />
                                        <span>Saldo Dompet:</span>
                                    </div>
                                    <p className="font-bold text-lg text-green-600 dark:text-green-400 mt-1">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(profile.wallet_balance || 0)}
                                    </p>
                                </div>
                                <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profil Saya</Link>
                                <Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Pesanan Saya</Link>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">Logout</button>
                            </>
                         )}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-sm flex justify-center items-start pt-20" onClick={() => setIsSearchOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <form action="/products" method="GET" onSubmit={() => setIsSearchOpen(false)}>
                  <input type="text" name="search" placeholder="Cari produk di Core Teknologi..." className="w-full py-4 pl-6 pr-12 text-lg bg-transparent border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
                  <button type="submit" className="absolute top-0 right-0 h-full flex items-center pr-5" aria-label="Cari"><SearchIcon /></button>
              </form>
              {(suggestedProducts.length > 0 || isSearching) && (
                <div className="border-t dark:border-gray-700 mt-2 pt-2">
                    {isSearching ? <p className="text-center p-4 text-gray-500">Mencari...</p> : (
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
                    )}
                </div>
              )}
            </motion.div>
             <button onClick={() => setIsSearchOpen(false)} className="absolute top-5 right-5 text-white hover:text-gray-300" aria-label="Tutup pencarian"><CloseIcon /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}