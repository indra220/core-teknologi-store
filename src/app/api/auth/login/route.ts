import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const supabase = await createClient();

  // 1. Cari profil berdasarkan username untuk mendapatkan email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email') // Langsung ambil email dari tabel profiles
    .ilike('username', username) // Gunakan ilike untuk case-insensitive
    .single();

  if (profileError || !profile || !profile.email) {
    return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 400 });
  }

  // 2. Lakukan sign in menggunakan email yang ditemukan
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Login berhasil' }, { status: 200 });
}