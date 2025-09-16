// src/context/SessionContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react'; // <-- 1. Impor useMemo
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile, EmailStatus } from '@/types'; // <-- Impor EmailStatus
import { useRouter } from 'next/navigation';

interface AppNotification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface SessionContextType {
  user: User | null;
  profile: (Profile & { email_status: EmailStatus }) | null; // <-- Pastikan tipe profil menyertakan email_status
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
  const supabase = createClient();
  const router = useRouter();

  const fetchSessionData = useCallback(async (sessionUser: User | null) => {
    if (sessionUser) {
      setUser(sessionUser);

      const [profileRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sessionUser.id).single(),
        supabase.from('notifications').select('*').eq('user_id', sessionUser.id).order('created_at', { ascending: false })
      ]);
      
      const userProfile = profileRes.data as (Profile & { email_status: EmailStatus }) | null;
      setProfile(userProfile);
      setNotifications(notificationsRes.data as AppNotification[] || []);

      if (userProfile?.role) {
        localStorage.setItem('userRole', userProfile.role);
      }

    } else {
      setUser(null);
      setProfile(null);
      setNotifications([]);
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('userRole');
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    const resetTimer = () => {
      const sessionStart = localStorage.getItem('sessionStartTime');
      if (sessionStart) {
        localStorage.setItem('sessionStartTime', Date.now().toString());
      }
    };
    events.forEach(event => window.addEventListener(event, resetTimer));
    const checkSessionTimeout = async () => {
      const sessionStart = localStorage.getItem('sessionStartTime');
      const userRole = localStorage.getItem('userRole');
      if (sessionStart && userRole) {
        const now = Date.now();
        const startTime = parseInt(sessionStart, 10);
        const timeoutDuration = userRole === 'admin' 
          ? 24 * 60 * 60 * 1000 
          : 2 * 60 * 60 * 1000;
        if (now - startTime > timeoutDuration) {
          alert('Sesi Anda telah berakhir. Silakan login kembali.');
          await supabase.auth.signOut();
          router.push('/login');
          localStorage.removeItem('sessionStartTime');
          localStorage.removeItem('userRole');
        }
      }
    };
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearInterval(intervalId);
    };
  }, [supabase, router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionData(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionData(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [fetchSessionData, supabase]);
  
  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchSessionData(session?.user ?? null);
  }, [fetchSessionData, supabase]);

  // <-- 2. Bungkus objek 'value' dengan useMemo -->
  const value = useMemo(() => ({
    user,
    profile,
    notifications,
    refreshSession,
    loading
  }), [user, profile, notifications, refreshSession, loading]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}