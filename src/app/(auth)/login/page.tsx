// src/app/(auth)/login/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from '@/components/NavigationLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/context/SessionContext';
import NProgress from 'nprogress';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  ExclamationCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: sessionLoading } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'clearsession') {
      supabase.auth.signOut();
      localStorage.setItem('auth_flow_status', JSON.stringify({ state: 'recovery_ended', timestamp: Date.now() }));
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, supabase, router]);
  
  useEffect(() => {
    if (sessionLoading) return;
    if (profile) {
      const targetUrl = profile.role === 'admin' ? '/admin' : '/';
      router.replace(targetUrl);
    }
  }, [profile, sessionLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    NProgress.start();

    localStorage.removeItem('auth_flow_status');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email, role')
      .ilike('username', username)
      .single();

    if (profileError || !profileData || !profileData.email) {
      setError('Username tidak ditemukan dalam sistem kami.');
      setLoading(false);
      NProgress.done();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password,
    });
    
    setLoading(false);

    if (signInError) {
      setError('Kredensial yang Anda masukkan tidak valid.');
      NProgress.done();
    } else {
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('userRole', profileData.role);
      const targetUrl = profileData.role === 'admin' ? '/admin' : '/';
      router.push(`${targetUrl}?message=login_success`);
      router.refresh();
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400 shadow-sm";

  return (
    <div className="w-full max-w-md p-8 sm:p-10 bg-white dark:bg-[#111827] rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800 my-8">
      <div className="mb-8 text-center">
         <div className="mx-auto h-16 w-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <ArrowRightOnRectangleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
         </div>
         <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Selamat Datang</h1>
         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Masuk untuk melanjutkan ke Core Teknologi.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex gap-3 items-start animate-in fade-in">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              id="username" name="username" type="text" required 
              value={username} onChange={(e) => setUsername(e.target.value)}
              className={inputClass} placeholder="Masukkan username" 
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
             <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
             <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                Lupa Password?
             </Link>
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              id="password" name="password" type="password" required 
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputClass} placeholder="••••••••" 
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <span className="animate-pulse">Mengautentikasi...</span> : 'Masuk Sekarang'}
        </button>
      </form>
      
      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8 font-medium">
        Belum memiliki akun?{' '}
        <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold transition-colors">
          Daftar Gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-96 bg-white dark:bg-[#111827] rounded-3xl animate-pulse"></div>}>
      <LoginForm />
    </Suspense>
  );
}