// src/app/(auth)/register/page.tsx
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from '@/components/NavigationLoader';
import NProgress from 'nprogress';
import { registerUser } from './actions'; 
import { useRouter } from 'next/navigation';
import { 
  UserCircleIcon,
  EnvelopeIcon, 
  LockClosedIcon,
  AtSymbolIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) NProgress.start();
    else NProgress.done();
  }, [pending]);
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? <span className="animate-pulse">Memproses Pendaftaran...</span> : 'Buat Akun Baru'}
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, null);

  useEffect(() => {
    if (state?.type === 'success') {
      setTimeout(() => {
        router.push('/login');
      }, 3000); 
    }
  }, [state, router]);

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full max-w-md p-8 sm:p-10 bg-white dark:bg-[#111827] rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800 my-8">
      <div className="mb-8 text-center">
         <div className="mx-auto h-16 w-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <UserPlusIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
         </div>
         <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Bergabunglah</h1>
         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Buat akun untuk mulai berbelanja.</p>
      </div>

      {state?.message && (
        <div className={`mb-6 p-4 rounded-xl text-sm border flex gap-3 items-start animate-in fade-in ${state.type === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
          {state.type === 'error' ? <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" /> : <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />}
          <span className="font-medium leading-relaxed">{state.message}</span>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="fullName" className={labelClass}>Nama Lengkap</label>
          <div className="relative">
            <UserCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input id="fullName" name="fullName" type="text" required disabled={isPending} className={inputClass} placeholder="John Doe" />
          </div>
        </div>
        <div>
          <label htmlFor="username" className={labelClass}>Username</label>
          <div className="relative">
            <AtSymbolIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input id="username" name="username" type="text" required disabled={isPending} className={inputClass} placeholder="johndoe123" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Alamat Email</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input id="email" name="email" type="email" required disabled={isPending} className={inputClass} placeholder="john@example.com" />
          </div>
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input id="password" name="password" type="password" required disabled={isPending} className={inputClass} placeholder="Minimal 6 karakter" />
          </div>
        </div>
        
        <SubmitButton />
      </form>
      
      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8 font-medium">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold transition-colors">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}