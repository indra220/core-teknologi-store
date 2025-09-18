// src/components/notifications/NotificationBell.tsx
import { createClient } from '@/lib/supabase/server';
import NotificationUI from './NotificationUI';
import { unstable_cache } from 'next/cache';

const getCachedNotifications = unstable_cache(
  async (supabase, userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { notifications: data, error };
  },
  ['user-notifications'],
  {
    tags: ['notifications'],
  }
);

export default async function NotificationBell() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { notifications } = await getCachedNotifications(supabase, user.id);

  return <NotificationUI initialNotifications={notifications || []} />;
}