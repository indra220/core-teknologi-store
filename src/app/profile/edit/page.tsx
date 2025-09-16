// src/app/profile/edit/page.tsx
'use client';

import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EditProfileForm from './EditProfileForm'; // Path impor ini sudah benar

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
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Edit Profil</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Perbarui informasi akun dan alamat Anda di sini.</p>
      </header>
      
      {/* Melewatkan user dan profile sebagai props ke komponen form */}
      <EditProfileForm user={user} profile={profile} />
    </div>
  );
}