// src/lib/actions/notifications.ts
'use server';

import { createClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Mengabaikan peringatan Linter bawaan jika tipe lokal mewajibkan 2 argumen
import { revalidateTag } from "next/cache";

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
  message?: string;
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
  
  revalidateTag('notifications', 'max'); 
  return { success: true };
}

export async function deleteNotification(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Pengguna tidak terautentikasi.' };
  }

  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (deleteError) {
    console.error('Gagal menghapus notifikasi:', deleteError);
    return { success: false, error: 'Gagal menghapus notifikasi di database.' };
  }

  revalidateTag('notifications', 'max');
  return { success: true };
}

// FUNGSI BARU: Menghapus semua notifikasi yang sudah dibaca
export async function clearReadNotifications(): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
      return { success: false, error: "Akses ditolak.", message: "Akses ditolak." };
  }

  // Menghapus notifikasi milik user yang sudah dibaca (read_at tidak null)
  const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .not('read_at', 'is', null);

  if (error) {
      console.error("Gagal menghapus notifikasi:", error);
      return { success: false, error: "Gagal membersihkan notifikasi.", message: "Gagal membersihkan notifikasi." };
  }

  revalidateTag('notifications', 'max');
  
  return { success: true, message: "Notifikasi yang dibaca berhasil dihapus." };
}