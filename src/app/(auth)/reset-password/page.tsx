// src/app/(auth)/reset-password/page.tsx
'use client';

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import NProgress from "nprogress";
import { updatePassword } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) NProgress.start();
    else NProgress.done();
  }, [pending]);

  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
      {pending ? 'Menyimpan...' : 'Simpan Password Baru'}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, null);

  useEffect(() => {
    // Tulis ke localStorage untuk memicu event di tab lain
    localStorage.setItem('auth_flow_status', JSON.stringify({ 
      state: 'recovery_started', 
      timestamp: Date.now() 
    }));
  }, []);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-xl space-y-8 border border-gray-100">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Reset Password</h1>
            <p className="mt-2 text-gray-600">Masukkan password baru Anda di bawah ini.</p>
        </div>
        
        {state?.message && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" 
              placeholder="Minimal 6 karakter" 
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" 
              placeholder="Ulangi password baru Anda"
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}