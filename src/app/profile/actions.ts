// src/app/profile/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from 'zod';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

const UpdateProfileSchema = z.object({
  full_name: z.string().min(3, "Nama Lengkap minimal 3 karakter.").optional().or(z.literal('')),
  username: z.string().min(3, "Username minimal 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  address_detail: z.string().optional(),
  avatar: z.instanceof(File).optional(),
});

export async function updateProfile(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { message: 'Pengguna tidak ditemukan.', type: 'error' };
  }

  const validatedFields = UpdateProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessage = Object.values(validatedFields.error.flatten().fieldErrors).join(' ');
    return { message: errorMessage, type: 'error' };
  }

  const { 
    full_name,
    username, 
    email, 
    newPassword, 
    currentPassword, 
    address_detail,
    avatar,
  } = validatedFields.data;

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (passwordError) {
    return { message: 'Password saat ini yang Anda masukkan salah.', type: 'error' };
  }

  // =========================================================================
  // <-- PERBAIKAN UTAMA: Memberikan tipe yang spesifik -->
  const profileUpdates: {
    full_name?: string | null;
    username: string;
    address_detail?: string | null;
    avatar_url?: string;
  } = {
    full_name: full_name,
    username: username,
    address_detail: address_detail,
  };
  // =========================================================================

  if (avatar && avatar.size > 0) {
    if (avatar.size > 5 * 1024 * 1024) {
        return { message: "Ukuran file terlalu besar. Maksimal 5MB.", type: 'error' };
    }

    const fileExtension = avatar.name.split('.').pop();
    const fileName = `${user.id}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatar, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { message: `Gagal mengunggah avatar: ${uploadError.message}`, type: 'error' };
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    profileUpdates.avatar_url = `${data.publicUrl}?t=${new Date().getTime()}`;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id);
  
  if (profileError) {
    return { message: 'Gagal memperbarui profil: ' + profileError.message, type: 'error' };
  }
  
  const userUpdates: { email?: string; password?: string } = {};
  if (email && email !== user.email) {
    userUpdates.email = email;
    await supabase.from('profiles').update({ email_status: 'PENDING_CHANGE' }).eq('id', user.id);
  }
  if (newPassword) {
    userUpdates.password = newPassword;
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser(userUpdates);
    if (authError) {
      return { message: 'Gagal memperbarui info login: ' + authError.message, type: 'error' };
    }
  }
  
  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { message: "Profil berhasil diperbarui!", type: 'success' };
}

export async function resendVerificationEmail(_prevState: FormState, _formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.new_email) {
    return { message: "Tidak ada email baru yang menunggu verifikasi.", type: "error" };
  }
  const { error } = await supabase.auth.resend({ type: 'email_change', email: user.new_email });
  if (error) {
    return { message: "Gagal mengirim ulang email: " + error.message, type: "error" };
  }
  return { message: "Email verifikasi telah dikirim ulang.", type: "success" };
}