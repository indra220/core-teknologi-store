// src/app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createClient();

  // Pastikan sesi benar-benar ada sebelum mencoba melakukan signout ke server
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('SignOut Error:', error.message);
      // Tetap paksa redirect ke login meskipun terjadi error di Supabase
      return NextResponse.redirect(`${requestUrl.origin}/login?error=logout_failed`, {
        status: 302,
      });
    }
  }

  // Logout berhasil, kembalikan ke halaman login dengan pesan sukses
  return NextResponse.redirect(`${requestUrl.origin}/login?message=logout_success&action=clearsession`, {
    status: 302,
  });
}