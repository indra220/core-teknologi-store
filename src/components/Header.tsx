// src/components/Header.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server'; // Impor server client
import HeaderClient from './HeaderClient'; // Impor komponen client

export default async function Header() {
  // Ambil data user di server
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let isAdmin = false;

  // Jika user ada, ambil data profilnya
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();
    
    displayName = profile?.full_name || user.email || '';
    isAdmin = profile?.role === 'admin';
  }

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300">Core Teknologi Store</Link>
        
        {/* Render komponen client dan teruskan data sebagai props */}
        <HeaderClient
          user={user}
          displayName={displayName}
          isAdmin={isAdmin}
        />
      </nav>
    </header>
  );
}