'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter(); // Sekarang kita akan gunakan ini
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
      // PERBAIKAN: Arahkan ke halaman login setelah beberapa detik
      setTimeout(() => {
        router.push('/login');
      }, 3000); // Tunggu 3 detik sebelum redirect
    }
  };

  return (
    <div className="flex justify-center items-center h-screen -mt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Buat Akun Baru</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
            Register
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}