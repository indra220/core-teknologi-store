// src/app/forgot-password/page.tsx
'use client';

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "@/components/NavigationLoader";
import NProgress from "nprogress";
import { requestPasswordReset } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) NProgress.start();
    else NProgress.done();
  }, [pending]);

  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
      {pending ? 'Mengirim...' : 'Kirim Link Reset'}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, null);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Lupa Password</h1>
            <p className="mt-2 text-gray-600">Masukkan email Anda dan kami akan mengirimkan link untuk mereset password Anda.</p>
        </div>
        
        {state?.message && (
          <div className={`${state.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} p-3 rounded-lg text-sm`}>
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" 
              placeholder="email@anda.com" 
            />
          </div>
          <SubmitButton />
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Ingat password Anda?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}