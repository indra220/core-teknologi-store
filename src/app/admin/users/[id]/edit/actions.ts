// src/app/admin/users/[id]/edit/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { z } from 'zod';
import { redirect } from 'next/navigation';

type FormState = {
  message: string | null;
  type: 'success' | 'error' | null;
};

// Skema validasi untuk data yang diupdate
const UpdateUserSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().min(3, "Username minimal 3 karakter."),
  fullName: z.string().min(3, "Nama Lengkap minimal 3 karakter."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
  adminPassword: z.string().min(1, "Password konfirmasi admin wajib diisi."),
});

export async function updateUserByAdmin(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser || !adminUser.email) {
    return { message: 'Admin tidak ditemukan.', type: 'error' };
  }

  const validatedFields = UpdateUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessage = Object.values(validatedFields.error.flatten().fieldErrors).join(' ');
    return { message: errorMessage, type: 'error' };
  }

  const { userId, username, fullName, newPassword, adminPassword } = validatedFields.data;

  // 1. Verifikasi password admin yang sedang login
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: adminUser.email,
    password: adminPassword,
  });

  if (passwordError) {
    return { message: 'Password konfirmasi admin Anda salah.', type: 'error' };
  }
  
  let successMessage = "Data pengguna berhasil diperbarui.";

  // 2. Update tabel profiles (username, full_name)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ username, full_name: fullName })
    .eq('id', userId);

  if (profileError) {
    return { message: "Gagal memperbarui profil: " + profileError.message, type: 'error' };
  }

  // 3. Jika password baru diisi, update password di auth
  if (newPassword) {
    const supabaseAdmin = await createClient(true); // Gunakan service role untuk update user
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    if (authError) {
      return { message: "Gagal memperbarui password: " + authError.message, type: 'error' };
    }
    successMessage = "Profil dan password pengguna berhasil diperbarui.";
  }

  revalidateTag('users');
  revalidateTag(`users/${userId}`);
  return { message: successMessage, type: 'success' };
}

// --- PERBAIKAN FUNGSI HAPUS PENGGUNA ---
export async function deleteUserByAdmin(prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = formData.get('userId') as string;
  const adminPassword = formData.get('adminPassword') as string;

  // Buat client standar untuk verifikasi password admin
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser || !adminUser.email) {
    return { message: 'Admin tidak ditemukan.', type: 'error' };
  }

  if (!adminPassword) {
    return { message: 'Password konfirmasi admin wajib diisi.', type: 'error' };
  }

  // Verifikasi password admin yang sedang login
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: adminUser.email,
    password: adminPassword,
  });

  if (passwordError) {
    return { message: 'Password konfirmasi admin Anda salah.', type: 'error' };
  }
  
  // Buat service client HANYA untuk operasi penghapusan
  const supabaseAdmin = await createClient(true);
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (deleteError) {
    return { message: "Gagal menghapus pengguna: " + deleteError.message, type: 'error' };
  }

  revalidateTag('users');
  revalidateTag('dashboard-stats');
  redirect('/admin/users');
}