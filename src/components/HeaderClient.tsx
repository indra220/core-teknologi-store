// src/components/HeaderClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import Cart from './Cart';
import { useCart } from '@/context/CartContext';
import { logout } from '@/app/auth/actions'; // Impor server action

interface HeaderClientProps {
  user: User | null;
  displayName: string | null;
  isAdmin: boolean;
}

export default function HeaderClient({ user, displayName, isAdmin }: HeaderClientProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  
  const profileLink = isAdmin ? "/admin" : "/profile";

  return (
    <>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-700 rounded-full">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{cartCount}</span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-sm hidden sm:block hover:text-gray-300">
                Halo, {displayName}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link href={profileLink} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{isAdmin ? 'Dashboard' : 'Profil Saya'}</Link>
                  {!isAdmin && (
                     <Link href="/orders" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pesanan Saya</Link>
                  )}
                  <form action={logout}>
                    <button type="submit" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
            <Link href="/login" className="hover:text-gray-300">Login</Link>
            <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">Register</Link>
          </>
        )}
      </div>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}