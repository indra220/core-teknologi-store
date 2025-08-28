'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from 'zod';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

const UpdateProfileSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
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

  const { username, email, newPassword, currentPassword } = validatedFields.data;

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (passwordError) {
    return { message: 'Password saat ini yang Anda masukkan salah.', type: 'error' };
  }

  let successMessage = "Tidak ada perubahan yang disimpan.";

  const { error: usernameError } = await supabase
    .from('profiles')
    .update({ username: username })
    .eq('id', user.id);
  
  if (usernameError) {
    return { message: 'Gagal memperbarui username. Mungkin sudah digunakan.', type: 'error' };
  }
  successMessage = "Profil berhasil diperbarui!";
  
  const userUpdates: { email?: string; password?: string } = {};
  if (email && email !== user.email) {
    userUpdates.email = email;
  }
  if (newPassword) {
    userUpdates.password = newPassword;
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser(userUpdates);
    if (authError) {
      return { message: 'Gagal memperbarui email/password: ' + authError.message, type: 'error' };
    }
    successMessage = "Profil dan info login berhasil diperbarui!";
    if (userUpdates.email) {
      successMessage += " Cek email baru Anda untuk verifikasi.";
    }
  }
  
  revalidatePath('/profile');
  return { message: successMessage, type: 'success' };
}

/**
 * Fungsi untuk mengirim ulang email verifikasi jika ada perubahan email yang tertunda.
 */
export async function resendVerificationEmail(_prevState: FormState, _formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: "Pengguna tidak ditemukan.", type: "error" };
  }

  const newEmail = user.new_email;
  if (!newEmail) {
    return { message: "Tidak ada email baru yang menunggu verifikasi.", type: "error" };
  }
  
  const { error } = await supabase.auth.resend({
    type: 'email_change',
    email: newEmail
  });

  if (error) {
    return { message: "Gagal mengirim ulang email: " + error.message, type: "error" };
  }

  return { message: "Email verifikasi telah dikirim ulang ke " + newEmail, type: "success" };
}