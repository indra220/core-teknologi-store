// src/app/login/actions.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type FormState = {
  message: string | null;
};

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { message: 'Username dan password wajib diisi.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .ilike('username', username)
    .single();

  if (!profile || !profile.email) {
    return { message: 'Username tidak ditemukan.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error) {
    return { message: 'Username atau password salah.' };
  }

  revalidatePath('/', 'layout');
  // PERBAIKAN: Tambahkan parameter ?message=login_success saat redirect
  redirect('/?message=login_success');
}