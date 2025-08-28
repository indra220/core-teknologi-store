'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { updateProfile, resendVerificationEmail } from './actions';
import { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

// Komponen Tombol Submit untuk form utama
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md
        ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
    >
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const router = useRouter();

  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(updateProfile, initialState);
  const [resendState, resendAction] = useActionState(resendVerificationEmail, initialState);

  useEffect(() => {
    if (formState.type === 'success') {
      const timer = setTimeout(() => {
        setIsEditing(false);
        setCurrentPassword('');
        if(formState.message) formState.message = null; 
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formState]);

  useEffect(() => {
    const supabase = createBrowserClient();
    
    const fetchAndSetUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single<Profile>();
      
      setUser(user);
      setProfile(profileData);

      if (profileData?.role === 'admin' && !window.location.pathname.startsWith('/admin')) {
        router.push('/admin');
      }
    };

    fetchAndSetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => { // PERBAIKAN: Tambahkan underscore pada parameter 'session'
      if (event === 'USER_UPDATED') {
        await fetchAndSetUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (!profile || !user) {
    return <div className="text-center py-10">Memuat data profil...</div>;
  }
  
  const isEmailChangePending = user.new_email !== null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Profil Saya</h1>
        <p className="mt-2 text-lg text-gray-600">Kelola informasi akun Anda di sini.</p>
      </header>

      {isEmailChangePending && !isEditing && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg relative mb-8 text-sm" role="alert">
          <strong className="font-semibold">Verifikasi Email!</strong>
          <span className="block sm:inline ml-2">Satu langkah lagi! Konfirmasi perubahan email Anda ke <span className="font-bold">{user.new_email}</span>.</span>
          <form action={resendAction} className="inline-block ml-2">
            <button type="submit" className="underline font-bold hover:text-yellow-900">(Kirim Ulang)</button>
          </form>
          {resendState.message && <p className="mt-2 text-xs font-bold">{resendState.message}</p>}
        </div>
      )}

      {isEditing ? (
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Edit Informasi Akun</h2>
          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input id="username" type="text" name="username" defaultValue={profile.username} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" name="email" defaultValue={user.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Password Baru (Opsional)</label>
              <input id="newPassword" type="password" name="newPassword" placeholder="Kosongkan jika tidak ingin diubah" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="border-t pt-6">
              <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-800 mb-1">Konfirmasi dengan Password Saat Ini</label>
              <p className="text-xs text-gray-500 mb-2">Untuk menyimpan perubahan, masukkan password Anda saat ini.</p>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            {formState?.message && (
              <div className={`p-3 rounded-lg text-sm ${formState.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {formState.message}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="w-full py-3 px-4 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold transition-colors">
                Batal
              </button>
              <SubmitButton />
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
           <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Informasi Akun</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row py-3 border-b">
              <dt className="font-medium text-gray-600 w-full sm:w-48">Username</dt>
              <dd className="text-gray-800 font-semibold">{profile.username}</dd>
            </div>
            <div className="flex flex-col sm:flex-row py-3 border-b">
              <dt className="font-medium text-gray-600 w-full sm:w-48">Email</dt>
              <dd className="text-gray-800 flex items-center">
                <span>{user.email}</span>
                {isEmailChangePending && (
                  <span className="ml-3 text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">PENDING</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row py-3">
              <dt className="font-medium text-gray-600 w-full sm:w-48">Nama Lengkap</dt>
              <dd className="text-gray-800">{profile.full_name || '-'}</dd>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-200 transform hover:-translate-y-0.5 shadow-md">
              Edit Profil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}