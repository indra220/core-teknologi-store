// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from '@/components/NavigationLoader'; // Ganti Link
import NProgress from 'nprogress'; // Impor NProgress

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    NProgress.start(); // <-- Mulai TopLoader

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      NProgress.done(); // <-- Hentikan jika gagal
    } else {
      setMessage('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">Buat Akun Baru</h1>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
            <strong className="font-semibold">Registrasi Gagal!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
            <strong className="font-semibold">Sukses!</strong>
            <span className="block sm:inline ml-2">{message}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* ... Sisa JSX form tidak berubah ... */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Contoh: John Doe"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Buat username unik Anda"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Untuk verifikasi email Anda"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Buat password yang kuat"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md
              ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
          >
            {loading ? 'Mendaftar...' : 'Register'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition duration-150 ease-in-out">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}