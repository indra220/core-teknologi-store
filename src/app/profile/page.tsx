// src/app/profile/page.tsx
'use client';

import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from '@/components/NavigationLoader';
import { useEffect } from 'react';

import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  PencilSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProfileInfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row py-5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors rounded-xl px-2 -mx-2">
    <dt className="flex items-center gap-3 font-semibold text-slate-600 dark:text-slate-400 w-full sm:w-56">
      <div className="text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      {label}
    </dt>
    <dd className="text-slate-900 dark:text-white mt-2 sm:mt-0 font-medium sm:flex-1">{value || '-'}</dd>
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Memuat profil Anda...</p>
      </div>
    );
  }

  const isEmailChangePending = profile.email_status === 'PENDING_CHANGE';

  let formattedAddress: React.ReactNode = "-";
  if (profile.address_detail) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let addr: any = profile.address_detail;
      if (typeof addr === 'string') {
          try {
              addr = JSON.parse(addr);
          } catch (_e) { }
      }
      
      if (addr && typeof addr === 'object' && addr.address_line_1) {
          formattedAddress = (
              <div className="leading-relaxed">
                <span className="block font-semibold text-slate-900 dark:text-white mb-0.5">{addr.address_line_1}</span>
                {addr.city}, {addr.province} <br/>
                <span className="font-mono text-sm text-slate-500">{addr.postal_code}</span>
              </div>
          );
      } else if (typeof profile.address_detail === 'string') {
          formattedAddress = profile.address_detail;
      }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profil */}
      <header className="flex flex-col items-center mb-10 text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-lg blur-[2px] opacity-70"></div>
          <Image
            src={profile.avatar_url || '/images/default-avatar.png'} 
            alt="Foto Profil"
            fill
            className="rounded-full object-cover border-4 border-white dark:border-[#020617] relative z-10 bg-white dark:bg-slate-800"
            sizes="128px"
            priority
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {profile.full_name || profile.username}
            {profile.role === 'customer' && <ShieldCheckIcon className="h-6 w-6 text-emerald-500" title="Akun Terverifikasi" />}
        </h1>
        <p className="mt-1.5 text-base font-medium text-slate-500 dark:text-slate-400">@{profile.username}</p>
      </header>

      {isEmailChangePending && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-start shadow-sm">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
                <strong className="font-bold text-amber-800 dark:text-amber-400 text-sm">Verifikasi Email Tertunda!</strong>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1 leading-relaxed">
                    Kami telah mengirimkan tautan konfirmasi ke <span className="font-bold">{user.new_email}</span>. Silakan periksa kotak masuk Anda untuk menyelesaikan perubahan email.
                </p>
            </div>
        </div>
      )}

      {/* Kartu Detail Informasi */}
      <div className="bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Informasi Personal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola data pribadi dan alamat pengiriman Anda.</p>
          </div>
          <Link 
            href="/profile/edit" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm active:scale-95"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit Profil
          </Link>
        </div>
        
        <dl className="space-y-1">
          <ProfileInfoRow icon={<UserCircleIcon className="h-5 w-5" />} label="Nama Lengkap" value={profile.full_name} />
          <ProfileInfoRow icon={<UserCircleIcon className="h-5 w-5 opacity-50" />} label="Username" value={<span className="font-mono">@{profile.username}</span>} />
          <ProfileInfoRow icon={<EnvelopeIcon className="h-5 w-5" />} label="Alamat Email" value={user.email} />
          <ProfileInfoRow icon={<MapPinIcon className="h-5 w-5" />} label="Destinasi Utama" value={formattedAddress} />
        </dl>
      </div>
      
    </div>
  );
}