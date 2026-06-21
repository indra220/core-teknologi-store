// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
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
        // PERBAIKAN: Menggunakan getAll() untuk mendukung chunking cookie berukuran besar
        getAll() {
          return cookieStore.getAll()
        },
        // PERBAIKAN: Menggunakan setAll() yang bisa menangani pembuatan & penghapusan banyak cookie sekaligus
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (_error) {
            // Error ini bisa diabaikan dengan aman jika dipanggil dari Server Component,
            // karena Next.js tidak mengizinkan modifikasi cookie saat merender halaman Server.
            // Modifikasi akan ditangani oleh Middleware jika Anda menggunakannya.
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