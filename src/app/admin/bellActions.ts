// src/app/admin/bellActions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function refreshAdminBell(orderId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && orderId) {
    // Menyuntikkan data notifikasi ke tabel `notifications` agar loncengnya berisi pesan baru.
    await supabase.from('notifications').insert({
      user_id: user.id, // Mengirim notif ke Admin yang sedang login
      message: `Ada pesanan baru yang membutuhkan konfirmasi Anda.`,
      read_at: null, // Sesuai dengan skema database Anda
    });
  }

  // 1. Bersihkan cache khusus lonceng notifikasi (memaksa argumen kedua agar TypeScript puas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revalidateTag('notifications', 'max' as any);
  
  // 2. Segarkan layout admin agar angka merah di lonceng muncul
  revalidatePath('/admin', 'layout');
}