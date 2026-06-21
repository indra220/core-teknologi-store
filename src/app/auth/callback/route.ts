// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Mengambil URL dan mengekstrak parameter
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/profile'; // Secara default diarahkan ke profil
  
  if (code) {
    const supabase = await createClient();
    
    // Menukar kode verifikasi (dari email) dengan sesi aktif
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // BERHASIL: Arahkan ke URL tujuan dengan menghapus query parameter code demi keamanan
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } else {
      // GAGAL: Ada masalah dari Supabase (kode kedaluwarsa, dll)
      console.error('Auth Callback Error:', error.message);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`);
    }
  }

  // Jika tidak ada kode sama sekali di URL
  return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_code`);
}