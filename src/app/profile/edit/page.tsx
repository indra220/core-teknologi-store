// src/app/profile/edit/page.tsx
'use client';

import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EditProfileForm from './EditProfileForm';
import Link from '@/components/NavigationLoader';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditProfilePage() {
  const { user, profile, loading: sessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/login');
    }
  }, [user, sessionLoading, router]);

  if (sessionLoading || !profile || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Mempersiapkan formulir...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <Link 
          href="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke Profil
        </Link>
      </div>
      
      <header className="mb-8 px-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengaturan Akun</h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Perbarui identitas, kredensial keamanan, dan alamat pengiriman Anda.</p>
      </header>
      
      <EditProfileForm user={user} profile={profile} />
    </div>
  );
}