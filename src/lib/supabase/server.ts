// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() { 
  const cookieStore = await cookies() 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch { // <-- Variabel (error) dihapus
            // Ini bisa diabaikan jika Anda menggunakan middleware
            // untuk me-refresh sesi pengguna.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch { // <-- Variabel (error) dihapus
            // Ini bisa diabaikan jika Anda menggunakan middleware
            // untuk me-refresh sesi pengguna.
          }
        },
      },
    }
  )
}