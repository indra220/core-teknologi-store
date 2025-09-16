// src/app/profile/edit/EditProfileForm.tsx
'use client';

import { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";
import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "../actions";
import Link from "@/components/NavigationLoader";
import Image from "next/image";
import NProgress from "nprogress";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

export default function EditProfileForm({ user, profile }: { user: User, profile: Profile }) {
  const { refreshSession } = useSession();
  const router = useRouter();
  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(updateProfile, initialState);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (formState.type) {
      NProgress.done();
      
      if (formState.type === 'success') {
        refreshSession();
        router.push('/profile?message=update_success');
      }
    }
  }, [formState, refreshSession, router]);

  return (
    <form action={formAction} onSubmit={() => NProgress.start()}>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
        
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
           <h3 className="font-bold text-lg mb-4 text-center text-gray-800 dark:text-gray-100">Foto Profil</h3>
           <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32">
                  <Image
                      src={avatarPreview || '/images/default-avatar.png'}
                      alt="Pratinjau Avatar"
                      fill
                      className="rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                  />
              </div>
              <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                  Pilih Foto
              </label>
              <input 
                id="avatar-upload" 
                name="avatar"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                ref={fileInputRef}
              />
          </div>
        </div>
        
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Informasi Akun</h3>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
              <input id="full_name" type="text" name="full_name" defaultValue={profile.full_name || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input id="username" type="text" name="username" defaultValue={profile.username} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Informasi Login</h3>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input id="email" type="email" name="email" defaultValue={user.email!} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru (Opsional)</label>
              <input id="newPassword" type="password" name="newPassword" placeholder="Kosongkan jika tidak ingin diubah" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
        </div>
        
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Alamat Pengiriman</h3>
            <div>
              <label htmlFor="address_detail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detail Alamat / Patokan</label>
              <textarea id="address_detail" name="address_detail" rows={3} defaultValue={profile.address_detail || ''} placeholder="Contoh: Jln. Mawar No. 5, Rumah cat hijau pagar hitam" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
        </div>

        <div className="p-6 bg-red-50 dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg">
          <label htmlFor="currentPassword" className="block text-sm font-bold text-red-800 dark:text-red-300 mb-1">Konfirmasi dengan Password Saat Ini</label>
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">Untuk menyimpan perubahan, masukkan password Anda saat ini.</p>
          <input id="currentPassword" type="password" name="currentPassword" required className="w-full px-4 py-2 border border-red-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-red-600 dark:text-white focus:ring-2 focus:ring-red-500" />
        </div>

        {/* ========================================================================= */}
        {/* <-- PERBAIKAN UTAMA: Hanya tampilkan pesan jika tipenya 'error' --> */}
        {formState?.type === 'error' && formState.message && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
            {formState.message}
          </div>
        )}
        {/* ========================================================================= */}
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/profile" className="w-full text-center py-3 px-4 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Batal</Link>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}