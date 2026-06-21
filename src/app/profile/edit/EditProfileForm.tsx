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

import { 
    PhotoIcon, 
    LockClosedIcon, 
    IdentificationIcon, 
    MapPinIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center min-w-[200px]"
    >
      {pending ? (
        <><span className="animate-pulse">Menyimpan Perubahan...</span></>
      ) : 'Simpan Perubahan'}
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let addr: any = {};
  if (profile.address_detail) {
      if (typeof profile.address_detail === 'string') {
          try {
              addr = JSON.parse(profile.address_detail);
          } catch (_e) {
              addr = { address_line_1: profile.address_detail };
          }
      } else {
          addr = profile.address_detail;
      }
  }

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

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <form action={formAction} onSubmit={() => NProgress.start()} className="space-y-6 pb-20">
        
        {/* Seksi 1: Avatar */}
        <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
           <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
               <PhotoIcon className="h-5 w-5 text-indigo-500" />
               Visual Profil
           </h3>
           <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
                  <Image
                      src={avatarPreview || '/images/default-avatar.png'}
                      alt="Pratinjau Avatar"
                      fill
                      className="rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Disarankan gambar beresolusi 1:1, maksimal 5MB.</p>
                  <label htmlFor="avatar-upload" className="cursor-pointer inline-flex bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors active:scale-95">
                      Unggah Foto Baru
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
        </div>
        
        {/* Seksi 2: Informasi Dasar */}
        <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
            <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
               <IdentificationIcon className="h-5 w-5 text-indigo-500" />
               Informasi Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="full_name" className={labelClass}>Nama Lengkap</label>
                    <input id="full_name" type="text" name="full_name" defaultValue={profile.full_name || ''} className={inputClass} placeholder="Cth: John Doe" />
                </div>
                <div>
                    <label htmlFor="username" className={labelClass}>Username</label>
                    <input id="username" type="text" name="username" defaultValue={profile.username} className={inputClass} placeholder="johndoe123" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="email" className={labelClass}>Alamat Email</label>
                    <input id="email" type="email" name="email" defaultValue={user.email!} className={inputClass} placeholder="john@example.com" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="newPassword" className={labelClass}>Password Baru <span className="normal-case text-slate-400 font-normal">(Opsional)</span></label>
                    <input id="newPassword" type="password" name="newPassword" placeholder="Biarkan kosong jika tidak ingin mengubah password" className={inputClass} />
                </div>
            </div>
        </div>
        
        {/* Seksi 3: Alamat Pengiriman */}
        <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800">
            <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
               <MapPinIcon className="h-5 w-5 text-indigo-500" />
               Destinasi Pengiriman
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address_line_1" className={labelClass}>Alamat Lengkap</label>
                  <textarea id="address_line_1" name="address_line_1" rows={3} defaultValue={addr?.address_line_1 || ''} placeholder="Contoh: Jl. Merdeka No. 123, RT 01/RW 02" className={`${inputClass} resize-none`}></textarea>
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>Kota / Kabupaten</label>
                  <input id="city" type="text" name="city" defaultValue={addr?.city || ''} placeholder="Contoh: Tasikmalaya" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="province" className={labelClass}>Provinsi</label>
                  <input id="province" type="text" name="province" defaultValue={addr?.province || ''} placeholder="Contoh: Jawa Barat" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="postal_code" className={labelClass}>Kode Pos</label>
                  <input id="postal_code" type="text" name="postal_code" defaultValue={addr?.postal_code || ''} placeholder="Contoh: 46115" className={inputClass} />
                </div>
            </div>
        </div>

        {/* Seksi 4: Verifikasi Keamanan */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-2 text-slate-900 dark:text-white">
               <LockClosedIcon className="h-5 w-5 text-slate-500" />
               Verifikasi Identitas
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Demi keamanan, masukkan password Anda saat ini untuk menyimpan perubahan di atas.</p>
          
          <div>
              <label htmlFor="currentPassword" className={labelClass}>Password Saat Ini <span className="text-rose-500">*</span></label>
              <input id="currentPassword" type="password" name="currentPassword" required className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm outline-none transition-shadow" placeholder="••••••••" />
          </div>
        </div>

        {/* Alert Error */}
        {formState?.type === 'error' && formState.message && (
          <div className="p-4 rounded-xl text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex gap-3 items-start animate-in fade-in">
             <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
             <span className="font-medium mt-0.5">{formState.message}</span>
          </div>
        )}
        
        {/* Aksi Form */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
          <Link href="/profile" className="w-full sm:w-auto text-center py-3 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors">
             Batal
          </Link>
          <SubmitButton />
        </div>

    </form>
  );
}