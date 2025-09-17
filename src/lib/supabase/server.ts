// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Tambahkan parameter opsional 'isAdmin'
export async function createClient(isAdmin = false) { 
  const cookieStore = await cookies() 

  // Pilih kunci berdasarkan parameter isAdmin
  const supabaseKey = isAdmin 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey, // Gunakan kunci yang sudah dipilih
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // Ini bisa diabaikan jika Anda menggunakan middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // Ini bisa diabaikan jika Anda menggunakan middleware
          }
        },
      },
      // Tambahkan opsi auth ini jika menggunakan service role key
      ...(isAdmin && {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
  )
}