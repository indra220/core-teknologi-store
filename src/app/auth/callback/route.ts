import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const redirectUrl = requestUrl.origin + '/login?message=auth_error';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Arahkan ke 'next' (misal: /reset-password) atau halaman utama
  return NextResponse.redirect(requestUrl.origin + next);
}