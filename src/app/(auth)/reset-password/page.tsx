// src/app/(auth)/reset-password/page.tsx
'use client';

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import NProgress from "nprogress";
import { updatePassword } from "./actions";
import { 
    ShieldCheckIcon,
    LockClosedIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) NProgress.start();
    else NProgress.done();
  }, [pending]);

  return (
    <button type="submit" disabled={pending} className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? <span className="animate-pulse">Menyimpan...</span> : 'Simpan Password Baru'}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, null);

  useEffect(() => {
    localStorage.setItem('auth_flow_status', JSON.stringify({ 
      state: 'recovery_started', 
      timestamp: Date.now() 
    }));
  }, []);

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full max-w-md p-8 sm:p-10 bg-white dark:bg-[#111827] rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800 my-8">
      <div className="mb-8 text-center">
         <div className="mx-auto h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
         </div>
         <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ubah Password</h1>
         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Silakan buat password baru untuk mengamankan akun Anda.</p>
      </div>
      
      {state?.message && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex gap-3 items-start animate-in fade-in">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{state.message}</span>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="password" className={labelClass}>Password Baru</label>
          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              id="password" name="password" type="password" required 
              className={inputClass} placeholder="Minimal 6 karakter" 
            />
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Konfirmasi Password</label>
          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              id="confirmPassword" name="confirmPassword" type="password" required 
              className={inputClass} placeholder="Ulangi password baru Anda"
            />
          </div>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}