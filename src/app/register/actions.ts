// src/app/register/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

type FormState = {
  message: string;
  type: 'success' | 'error';
} | null;

const RegisterSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama Lengkap minimal 3 karakter.' }),
  username: z.string()
    .min(3, { message: 'Username minimal 3 karakter.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username hanya boleh berisi huruf, angka, dan underscore (_).' }),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

export async function registerUser(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(errorMessage).flat()[0] || 'Input tidak valid.';
    return {
      message: firstError,
      type: 'error',
    };
  }

  const { email, password, fullName, username } = validatedFields.data;
  const supabase = await createClient();

  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .single();

  if (existingUser) {
    return { message: 'Username sudah digunakan. Silakan pilih yang lain.', type: 'error' };
  }
  
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username,
      },
    },
  });

  if (signUpError) {
    return { message: signUpError.message, type: 'error' };
  }

  if (data.user) {
    // --- PERBAIKAN DI SINI ---
    // Tambahkan 'await' karena createClient() adalah fungsi async
    const supabaseAdmin = await createClient(true); 
    
    const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
      user_id: data.user.id,
      message: 'Selamat datang! Yuk, lengkapi profil Anda sekarang.',
      link: '/profile/edit',
    });

    if (notificationError) {
      console.error('Gagal membuat notifikasi selamat datang:', notificationError.message);
    }
    // --- AKHIR PERBAIKAN ---

    revalidatePath('/', 'layout');
  }

  return { 
    message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.', 
    type: 'success' 
  };
}