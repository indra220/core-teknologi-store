// src/app/login/page.tsx

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .single();

    if (profileError || !profile || !profile.email) {
      setError('Username tidak ditemukan.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    
    setLoading(false);

    if (signInError) {
      setError('Username atau password salah.');
    } else {
      // PERBAIKAN: Hapus router.refresh() dan cukup arahkan pengguna.
      // Header akan diperbarui secara otomatis oleh onAuthStateChange.
      router.push('/?message=login_success');
    }
  };

  return (
    <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">Masuk Akun</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
          <strong className="font-semibold">Gagal Login!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input 
            id="username" 
            name="username" 
            type="text" 
            required 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" 
            placeholder="Masukkan username Anda" 
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" 
            placeholder="Masukkan password Anda" 
          />
        </div>
        <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? 'Memuat...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="w-full max-w-md h-96 bg-white rounded-2xl animate-pulse"></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}