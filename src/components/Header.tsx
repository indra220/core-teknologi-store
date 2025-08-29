'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Ambil data dari tabel profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        
        // Tentukan nama yang akan ditampilkan
        setDisplayName(profile?.full_name || user.email || '');
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    };
    
    fetchUser();

    // Listener untuk memastikan data terupdate saat login/logout dari tab lain
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        fetchUser(); // Panggil ulang untuk sinkronisasi
    });

    return () => {
        subscription.unsubscribe();
    };

  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
          {loading ? (
            // Tampilan loading skeleton
            <div className="h-6 w-48 bg-gray-700 rounded animate-pulse"></div>
          ) : user ? (
            <>
              <span className="text-sm hidden sm:block">Halo, {displayName}</span>
              <Link href={profileLink} className="hover:text-gray-300">{isAdmin ? 'Dashboard' : 'Profil'}</Link>
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">Login</Link>
              <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}