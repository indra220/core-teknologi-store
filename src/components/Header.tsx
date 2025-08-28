import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileLink = "/profile"; // Default link untuk user biasa
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role === 'admin') {
      isAdmin = true;
      profileLink = "/admin"; // Ubah link untuk admin
    }
  }

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300">
          Core Teknologi Store
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm hidden sm:block">Halo, {user.email}</span>
              {/* PERBAIKAN: Gunakan link dinamis */}
              <Link href={profileLink} className="hover:text-gray-300">
                {isAdmin ? 'Dashboard' : 'Profil'}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">Login</Link>
              <Link href="/register" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}