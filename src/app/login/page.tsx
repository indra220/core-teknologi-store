// src/app/login/page.tsx

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from './actions';

// Komponen tombol submit terpisah untuk mengakses status 'pending'
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {pending ? 'Memuat...' : 'Login'}
        </button>
    );
}

function LoginForm() {
  const initialState = { message: null };
  // Gunakan hook useActionState untuk menghubungkan form dengan server action
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">Masuk Akun</h1>
      
      {/* Tampilkan pesan error dari server action */}
      {state?.message && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
          <strong className="font-semibold">Gagal Login!</strong>
          <span className="block sm:inline ml-2">{state.message}</span>
        </div>
      )}
      
      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input id="username" name="username" type="text" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Masukkan username Anda" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input id="password" name="password" type="password" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Masukkan password Anda" />
        </div>
        <SubmitButton />
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