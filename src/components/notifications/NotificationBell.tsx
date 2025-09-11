// src/components/notifications/NotificationBell.tsx
import { createClient } from '@/lib/supabase/server';
import NotificationUI from './NotificationUI';

export default async function NotificationBell() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Jangan tampilkan apa pun jika tidak ada pengguna
  }

  // Pengambilan data sekarang terjadi di Server Component
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <NotificationUI initialNotifications={notifications || []} />;
}