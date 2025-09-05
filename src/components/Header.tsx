'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Cart from './Cart';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const { showNotification } = useNotification();
  // PERBAIKAN: Ambil 'loading' dari useCart dan ganti namanya menjadi 'cartLoading'
  const { cartCount, clearCart, loading: cartLoading } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async (user: User | null) => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        
        setDisplayName(profile?.full_name || user.email || '');
        setIsAdmin(profile?.role === 'admin');
      } else {
        setDisplayName(null);
        setIsAdmin(false);
      }
      setLoadingUser(false);
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        fetchUser(currentUser);
    });
    
    (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        await fetchUser(user);
    })();

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCart();
    showNotification('Logout berhasil!', 'info');
    router.push('/login');
    router.refresh();
  };

  const profileLink = isAdmin ? "/admin" : "/profile";

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300">Core Teknologi Store</Link>
        <div className="flex items-center space-x-4">
          {loadingUser ? (
            <div className="h-6 w-48 bg-gray-700 rounded animate-pulse"></div>
          ) : user ? (
            <>
              <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-sm hidden sm:block hover:text-gray-300">
                  Halo, {displayName}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link href={profileLink} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{isAdmin ? 'Dashboard' : 'Profil Saya'}</Link>
                    <a href="#" onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">Login</Link>
              <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">Register</Link>
            </>
          )}
          
          {/* PERBAIKAN: Gunakan 'cartLoading' untuk menampilkan placeholder */}
          {cartLoading ? (
            <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse"></div>
          ) : (
            <button onClick={() => setIsCartOpen(true)} className="relative p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{cartCount}</span>
              )}
            </button>
          )}
        </div>
      </nav>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}