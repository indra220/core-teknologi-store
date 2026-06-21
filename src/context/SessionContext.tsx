// src/context/SessionContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile, EmailStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/notifications/NotificationProvider';

interface AppNotification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface SessionContextType {
  user: User | null;
  profile: (Profile & { email_status: EmailStatus }) | null;
  notifications: AppNotification[];
  refreshSession: () => Promise<void>;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<(Profile & { email_status: EmailStatus }) | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PERBAIKAN: Pelacak ID Notifikasi agar tidak muncul ganda
  const notifiedIds = useRef<Set<string>>(new Set());
  
  const supabase = createClient();
  const router = useRouter();
  const { showNotification } = useNotification(); 

  const fetchSessionData = useCallback(async (sessionUser: User | null) => {
    if (sessionUser) {
      setUser(sessionUser);
      const [profileRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sessionUser.id).single(),
        supabase.from('notifications').select('*').eq('user_id', sessionUser.id).order('created_at', { ascending: false })
      ]);
      
      const userProfile = profileRes.data as (Profile & { email_status: EmailStatus }) | null;
      setProfile(userProfile);
      if (userProfile?.role) localStorage.setItem('userRole', userProfile.role);

      const fetchedNotifs = notificationsRes.data as AppNotification[] || [];
      setNotifications(fetchedNotifs);

      // PERBAIKAN: Sistem Catch-up (Menangkap notif yg terlewat saat redirect)
      const now = Date.now();
      fetchedNotifs.forEach(n => {
          if (!n.read_at && !notifiedIds.current.has(n.id)) {
              const notifTime = new Date(n.created_at).getTime();
              // Jika notifikasi dibuat kurang dari 3 detik yang lalu (akibat terlewat saat loading halaman checkout -> order)
              if (now - notifTime < 3000) { 
                  showNotification('Anda mendapat pemberitahuan baru', 'info');
              }
              notifiedIds.current.add(n.id);
          }
      });
      
    } else {
      setUser(null);
      setProfile(null);
      setNotifications([]);
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('userRole');
    }
    setLoading(false);
  }, [supabase, showNotification]);

  // Efek Keamanan Sesi (Timeout)
  useEffect(() => {
    const checkSessionTimeout = async () => {
      const sessionStart = localStorage.getItem('sessionStartTime');
      const userRole = localStorage.getItem('userRole');

      if (sessionStart && userRole) {
        const now = Date.now();
        const startTime = parseInt(sessionStart, 10);
        const timeoutDuration = userRole === 'admin' ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

        if (now - startTime > timeoutDuration) {
          showNotification('Sesi Anda telah berakhir demi keamanan. Silakan masuk kembali.', 'info');
          await supabase.auth.signOut();
          localStorage.removeItem('sessionStartTime');
          localStorage.removeItem('userRole');
          router.push('/login');
        }
      }
    };

    checkSessionTimeout();
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [supabase, router, showNotification]);
  
  // Efek Otentikasi Latar Belakang
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => fetchSessionData(session?.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      fetchSessionData(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchSessionData, supabase]);

  // EFEK REALTIME SUPABASE UNTUK NOTIFIKASI INSTAN
  useEffect(() => {
    if (!user) return;

    const notificationChannel = supabase
      .channel(`realtime-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          
          // Pastikan notifikasi ini belum pernah di-pop-up
          if (!notifiedIds.current.has(newNotification.id)) {
              setNotifications((prev) => [newNotification, ...prev]);
              showNotification('Anda mendapat pemberitahuan baru', 'info');
              notifiedIds.current.add(newNotification.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user, supabase, showNotification]);
  
  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchSessionData(session?.user ?? null);
  }, [fetchSessionData, supabase]);

  const value = useMemo(() => ({ user, profile, notifications, refreshSession, loading }), [user, profile, notifications, refreshSession, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}