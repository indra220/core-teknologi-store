// src/app/login/page.tsx

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useNotification } from '@/components/notifications/NotificationProvider';
// 1. Impor useRouter
import { useRouter } from 'next/navigation';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  // 2. Inisialisasi useRouter
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Terjadi kesalahan');
    } else {
      showNotification('Login berhasil! Selamat datang kembali.', 'success');
      
      // 3. PERBAIKAN UTAMA: Refresh halaman setelah notifikasi muncul
      // Ini akan membuat header dan komponen lain me-render ulang dengan data user baru.
      setTimeout(() => {
        router.refresh();
      }, 1000); // Beri jeda 1 detik agar notifikasi sempat terbaca
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
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Masukkan username Anda" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Masukkan password Anda" />
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