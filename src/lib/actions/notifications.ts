// src/lib/actions/notifications.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Notification = {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
  user_id: string;
};

type ActionResult = {
  success: boolean;
  notifications?: Notification[];
  error?: string;
};

export async function markNotificationAsRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Pengguna tidak terautentikasi.' };
  }

  const { error: updateError } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .match({ id: notificationId, user_id: user.id });

  if (updateError) {
    console.error('Gagal menandai notifikasi:', updateError);
    return { success: false, error: 'Gagal memperbarui notifikasi di database.' };
  }
  
  const { data: latestNotifications, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Gagal mengambil notifikasi terbaru:', fetchError);
    return { success: false, error: 'Gagal mengambil data notifikasi terbaru.' };
  }

  revalidatePath('/', 'layout'); 
  return { success: true, notifications: latestNotifications as Notification[] };
}

// --- FUNGSI BARU UNTUK MENGHAPUS NOTIFIKASI ---
export async function deleteNotification(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Pengguna tidak terautentikasi.' };
  }

  // RLS yang sudah kita buat akan menangani keamanan.
  // Kebijakan tersebut memastikan hanya pemilik notifikasi atau admin yang bisa menghapus.
  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (deleteError) {
    console.error('Gagal menghapus notifikasi:', deleteError);
    return { success: false, error: 'Gagal menghapus notifikasi di database.' };
  }

  // Ambil daftar notifikasi terbaru untuk dikembalikan ke client
  const { data: latestNotifications, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    revalidatePath('/', 'layout');
    return { success: true, notifications: [] };
  }

  revalidatePath('/', 'layout');
  return { success: true, notifications: latestNotifications as Notification[] };
}