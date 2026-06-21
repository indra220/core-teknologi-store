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
import { markNotificationAsRead, deleteNotification } from '@/lib/actions/notifications';
import { useSession } from '@/context/SessionContext';
import NProgress from 'nprogress';

interface Notification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface SearchResults {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
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
  loading: () => <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end items-center pr-8"><p className="text-white font-semibold animate-pulse">Membuka Keranjang...</p></div>
});

const CartIcon = () => ( <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> );
const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> </svg> );
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5Z" /></svg>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateDisplayId = (order: any) => {
    if (!order) return 'INV-UNKNOWN';
    const date = new Date(order.created_at);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;
    const firstItem = order.order_items?.[0];
    const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalQty = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
    const uniqueTail = order.id ? order.id.split('-')[0].substring(0, 4).toUpperCase() : 'XXXX';
    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
};

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
  
  const [searchResults, setSearchResults] = useState<SearchResults>({ products: [], orders: [] });
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

  // PERBAIKAN PENTING: Body Scroll Lock (Mencegah Halaman Utama Ikut Ter-scroll)
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const searchAll = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ products: [], orders: [] });
        return;
      }
      setIsSearching(true);
      try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
              const data = await response.json();
              setSearchResults({ products: data.products || [], orders: data.orders || [] });
          }
      } catch (error) {
          console.error("Gagal melakukan pencarian:", error);
      }
      setIsSearching(false);
    };

    const debounceTimeout = setTimeout(searchAll, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault(); 
      if (searchResults.orders.length > 0 && searchResults.products.length === 0) {
          router.push(`/orders/${searchResults.orders[0].id}`);
          setIsSearchOpen(false);
      } else if (searchQuery.trim()) {
          router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
          setIsSearchOpen(false);
      }
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    NProgress.start();
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('userRole');
    await supabase.auth.signOut();
    window.location.assign('/login?message=logout_success');
  };

  const displayName = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === 'admin';
  
  const headerClasses = isScrolled 
    ? 'bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 dark:border-slate-800' 
    : 'bg-transparent border-b border-transparent';

  if (pathname === '/reset-password' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 ${headerClasses}`}>
        <nav className="w-full max-w-[1536px] mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-5"> 
          <div className="flex items-center space-x-10">
            <Link href={isAdmin ? "/admin" : "/"} className="flex items-center space-x-3 group">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-transform group-hover:scale-105">
                 <Image src="/images/Logo-core.png" alt="Core Teknologi Logo" fill className="object-contain" sizes="48px"/>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Core Teknologi</span>
            </Link>
            {!isAdmin && (
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/products" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors tracking-wide">KATALOG PRODUK</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-700 dark:text-slate-200">
            {!isAdmin && (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Buka pencarian">
                    <SearchIcon />
                </button>
            )}
            
            {user && profile ? (
              <>
                {!isAdmin && (
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Buka keranjang">
                        <CartIcon />
                        {cartCount > 0 && (<span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-[#020617]">{cartCount}</span>)}
                    </button>
                )}

                <div className="relative">
                  <button onClick={() => { setIsNotificationOpen(prev => !prev); setIsDropdownOpen(false); }} className="relative p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Buka notifikasi" >
                    <BellIcon />
                    {unreadCount > 0 && (<span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-[#020617]">{unreadCount}</span>)}
                  </button>
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div ref={notificationRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#111827] rounded-2xl shadow-xl z-50 border border-slate-200/60 dark:border-slate-800 overflow-hidden" >
                        <div className="p-4 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white uppercase tracking-wider">Notifikasi</div>
                        <div className="max-h-80 overflow-y-auto overscroll-contain">
                          {notifications.length > 0 ? (
                            notifications.map(notif => {
                              const isUnread = notif.read_at === null;
                              return (
                                <div key={notif.id} className="relative group w-full border-b border-slate-50 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                  <button onClick={() => handleNotificationClick(notif)} className="w-full text-left block p-4 pr-10 focus:outline-none">
                                    <p className={`text-sm leading-snug ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>{notif.message}</p>
                                    <p className={`text-[11px] mt-1.5 font-semibold ${isUnread ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{timeAgo(notif.created_at)}</p>
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                                    className="absolute top-4 right-3 p-1.5 rounded-full text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Hapus notifikasi"
                                  >
                                    <CloseIconSmall />
                                  </button>
                                </div>
                              );
                            })
                          ) : (<p className="text-sm text-slate-500 text-center py-8">Tidak ada notifikasi baru.</p>)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative ml-1 sm:ml-2">
                  <button onClick={() => { setIsDropdownOpen(prev => !prev); setIsNotificationOpen(false); }} className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-indigo-500/50 transition-all overflow-hidden" aria-label="User Menu" >
                    {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Avatar" width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isDropdownOpen && (
                       <motion.div ref={userDropdownRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-3 w-60 bg-white dark:bg-[#111827] rounded-2xl shadow-xl z-50 border border-slate-200/60 dark:border-slate-800 overflow-hidden" >
                         <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masuk Sebagai</p>
                             <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                         </div>
                         
                         <div className="py-2">
                             {isAdmin ? (
                                <>
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                                        Keluar Akun
                                    </button>
                                </>
                             ) : (
                                <>
                                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                            <WalletIcon />
                                            Core Wallet
                                        </div>
                                        <p className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(profile.wallet_balance || 0)}
                                        </p>
                                    </div>
                                    <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Pengaturan Profil</Link>
                                    <Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Riwayat Transaksi</Link>
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                                        Keluar Akun
                                    </button>
                                </>
                             )}
                         </div>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Buka keranjang"><CartIcon /></button>
                <Link href="/login" className="ml-2 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95">Masuk</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {isCartOpen && <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
      
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4" onClick={() => setIsSearchOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              <form onSubmit={handleSearchSubmit} className="relative">
                  <input type="text" placeholder="Cari laptop, pesanan, atau brand..." className="w-full py-5 pl-6 pr-14 text-lg bg-transparent border-b border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
                  <button type="submit" className="absolute top-0 right-0 h-full flex items-center pr-5 text-indigo-500 hover:text-indigo-600 transition-colors" aria-label="Cari">
                      <SearchIcon />
                  </button>
              </form>
              
              {(searchResults.products.length > 0 || searchResults.orders.length > 0 || isSearching) && (
                <div className="bg-slate-50/50 dark:bg-slate-800/20">
                    {isSearching ? <p className="text-center p-6 text-sm font-bold text-slate-500 animate-pulse">Mencari hasil...</p> : (
                        // PERBAIKAN: Menambahkan overscroll-contain agar scroll tidak bocor ke halaman belakang
                        <div className="max-h-[60vh] overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                            
                            {/* BAGIAN HASIL PESANAN */}
                            {searchResults.orders.length > 0 && (
                                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                    Riwayat Transaksi
                                </div>
                            )}
                            {searchResults.orders.map(order => (
                                <Link key={order.id} href={`/orders/${order.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center p-4 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group">
                                    <div className="h-14 w-14 shrink-0 relative bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm overflow-hidden flex items-center justify-center text-indigo-500">
                                        <TagIcon />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{order.status}</p>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{generateDisplayId(order)}</p>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[300px]">{order.order_items?.map((i:any)=>i.product_name).join(', ')}</p>
                                    </div>
                                </Link>
                            ))}

                            {/* BAGIAN HASIL PRODUK */}
                            {searchResults.products.length > 0 && (
                                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                    Katalog Produk
                                </div>
                            )}
                            {searchResults.products.map(product => (
                                  <div key={product.id}>
                                    <Link href={`/laptop/${product.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center p-4 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group">
                                        <div className="h-14 w-14 shrink-0 relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center p-1">
                                            <Image src={product.image_url || '/placeholder.png'} alt={product.name || 'Produk'} fill className="object-contain p-1 group-hover:scale-110 transition-transform duration-300" sizes="56px" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{product.brand || '-'}</p>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name || 'Produk'}</p>
                                        </div>
                                    </Link>
                                  </div>
                            ))}
                        </div>
                    )}
                </div>
              )}
            </motion.div>
             <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Tutup pencarian">
                 <CloseIcon />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}