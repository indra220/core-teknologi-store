import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('users ( email )') // Sedikit perbaikan sintaks untuk kejelasan
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 400 });
  }

  // PERBAIKAN: Gunakan @ts-expect-error
  // @ts-expect-error: Tipe 'users' sengaja tidak kita definisikan secara formal di sini
  const email = profile.users.email;
  
  if (!email) {
    return NextResponse.json({ error: 'Email untuk pengguna ini tidak ditemukan' }, { status: 400 });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: 'Password salah' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Login berhasil' }, { status: 200 });
}