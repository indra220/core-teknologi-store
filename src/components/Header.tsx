// src/components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/CartContext';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop } from '@/types';

const Cart = dynamic(() => import('./Cart'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/60 z-50 flex justify-end items-center pr-4"><p className="text-white">Memuat Keranjang...</p></div>
});

// --- IKON-IKON ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const CartIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface ProfileInfo {
  displayName: string | null;
  isAdmin: boolean;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Laptop[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Laptop[]>([]);
  const { cartCount } = useCart();
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 10); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
        const { data } = await supabase.from('laptops').select('*');
        if (data) setAllProducts(data);
    };
    fetchAllProducts();
  }, [supabase]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
        setProfile({
          displayName: profileData?.full_name || user.email || '',
          isAdmin: profileData?.role === 'admin'
        });
      } else {
        setProfile(null);
      }
    };

    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            fetchUser();
        } else {
            setProfile(null);
        }
    });

    return () => { subscription.unsubscribe(); };
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
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.push('/login?message=logout_success');
    router.refresh();
  };

  const profileLink = profile?.isAdmin ? "/admin" : "/profile";
  const headerClasses = isScrolled
    ? 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700'
    : 'bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700';
  
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
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{cartCount}</span>
                  )}
                </button>
                <div className="relative">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="User Menu">
                    <UserIcon />
                  </button>
                  {isDropdownOpen && (
                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700">
                       <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">
                         Halo, {profile.displayName}
                       </div>
                       <Link href={profileLink} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{profile.isAdmin ? 'Dashboard' : 'Profil Saya'}</Link>
                       {!profile.isAdmin && (
                          <Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Pesanan Saya</Link>
                       )}
                       <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">Logout</button>
                     </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Buka keranjang">
                  <CartIcon />
                </button>
                {/* --- PERUBAHAN DI SINI: MENGGANTI LOGIN/REGISTER DENGAN IKON --- */}
                <Link href="/login" className="p-2 hover:bg-black/5 rounded-full dark:hover:bg-white/10" aria-label="Login atau Register">
                    <UserIcon />
                </Link>
                {/* --- AKHIR PERUBAHAN --- */}
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