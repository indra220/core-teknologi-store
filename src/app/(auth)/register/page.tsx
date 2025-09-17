// src/app/register/page.tsx
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from '@/components/NavigationLoader';
import NProgress from 'nprogress';
import { registerUser } from './actions'; // Impor Server Action baru
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();

  // Efek untuk NProgress saat submit
  useEffect(() => {
    if (pending) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [pending]);
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md
        ${pending ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
    >
      {pending ? 'Mendaftar...' : 'Register'}
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, null);

  // Redirect jika registrasi sukses
  useEffect(() => {
    if (state?.type === 'success') {
      setTimeout(() => {
        router.push('/login');
      }, 3000); // Redirect setelah 3 detik
    }
  }, [state, router]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">Buat Akun Baru</h1>

        {state?.message && (
          <div className={`${state.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'} px-4 py-3 rounded-lg relative text-sm`} role="alert">
            <strong className="font-semibold">{state.type === 'error' ? 'Registrasi Gagal!' : 'Sukses!'}</strong>
            <span className="block sm:inline ml-2">{state.message}</span>
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Contoh: John Doe"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Buat username unik Anda"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Untuk verifikasi email Anda"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 ease-in-out shadow-sm"
              placeholder="Buat password yang kuat"
            />
          </div>
          
          <SubmitButton />

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