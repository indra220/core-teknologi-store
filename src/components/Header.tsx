// src/components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
// import Cart from './Cart'; // Hapus impor statis
import { useCart } from '@/context/CartContext';
import dynamic from 'next/dynamic'; // 1. Impor 'dynamic'

// 2. Muat komponen Cart secara dinamis
const Cart = dynamic(() => import('./Cart'), { 
  ssr: false, // Komponen ini tidak perlu di-render di server
  loading: () => <div className="fixed inset-0 bg-black/60 z-50 flex justify-end items-center pr-4"><p className="text-white">Memuat Keranjang...</p></div>
});


// --- IKON ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const CartIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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
  const { cartCount } = useCart();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        
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

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.push('/login?message=logout_success');
    router.refresh();
  };

  const profileLink = profile?.isAdmin ? "/admin" : "/profile";

  return (
    <>
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-gray-300">Core Teknologi Store</Link>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && profile ? (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-700 rounded-full">
                  <CartIcon />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{cartCount}</span>
                  )}
                </button>
                
                <div className="relative">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-sm hidden sm:block hover:text-gray-300">
                    Halo, {profile.displayName}
                  </button>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-2 block sm:hidden hover:bg-gray-700 rounded-full">
                    <UserIcon />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link href={profileLink} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{profile.isAdmin ? 'Dashboard' : 'Profil Saya'}</Link>
                      {!profile.isAdmin && (
                         <Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pesanan Saya</Link>
                      )}
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2">
                  <CartIcon />
                </button>
                <Link href="/login" className="hover:text-gray-300 text-sm sm:text-base">Login</Link>
                <Link href="/register" className="bg-blue-600 px-3 sm:px-4 py-2 rounded hover:bg-blue-700 text-sm">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      {/* 3. Render Cart. State isCartOpen akan memicu dynamic import saat nilainya true */}
      {isCartOpen && <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
}