// src/app/profile/page.tsx
'use client';

import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from '@/components/NavigationLoader';
import { useEffect } from 'react';

// Komponen untuk menampilkan satu baris informasi
const ProfileInfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex flex-col sm:flex-row py-4 border-b border-gray-200 dark:border-gray-700">
    <dt className="font-semibold text-gray-600 dark:text-gray-400 w-full sm:w-48">{label}</dt>
    <dd className="text-gray-800 dark:text-gray-100 mt-1 sm:mt-0">{value || '-'}</dd>
  </div>
);

export default function ProfilePage() {
  const { user, profile, loading: sessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading) {
      if (!user) {
        router.replace('/login');
      } else if (profile?.role === 'admin') {
        router.replace('/admin');
      }
    }
  }, [user, profile, sessionLoading, router]);

  if (sessionLoading || !profile || !user) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data profil...</p>
      </div>
    );
  }

  const isEmailChangePending = profile.email_status === 'PENDING_CHANGE';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'} // Sediakan gambar default
            alt="Foto Profil"
            fill
            className="rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
            sizes="128px"
          />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">{profile.full_name || profile.username}</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">@{profile.username}</p>
      </header>

      {isEmailChangePending && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg relative mb-8 text-sm text-center" role="alert">
          <strong className="font-semibold">Verifikasi Email!</strong>
          <span className="block sm:inline ml-2">Satu langkah lagi! Konfirmasi perubahan email Anda ke <span className="font-bold">{user.new_email}</span>.</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Informasi Akun</h2>
          <Link href="/profile/edit" className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 transform hover:scale-105 shadow-md">
            Edit Profil
          </Link>
        </div>
        
        <dl>
          <ProfileInfoRow label="Nama Lengkap" value={profile.full_name} />
          <ProfileInfoRow label="Username" value={`@${profile.username}`} />
          <ProfileInfoRow label="Email" value={user.email} />
          <ProfileInfoRow label="Detail Alamat" value={profile.address_detail} />
        </dl>
      </div>
    </div>
  );
}