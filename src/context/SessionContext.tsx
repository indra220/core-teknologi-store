// src/context/SessionContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile, EmailStatus } from '@/types';
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
      if (userProfile?.role) localStorage.setItem('userRole', userProfile.role);
    } else {
      setUser(null);
      setProfile(null);
      setNotifications([]);
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('userRole');
    }
    setLoading(false);
  }, [supabase]);

  // --- PERBAIKAN UTAMA PADA LOGIKA SESI EXPIRE ---
  useEffect(() => {
    const checkSessionTimeout = async () => {
      const sessionStart = localStorage.getItem('sessionStartTime');
      const userRole = localStorage.getItem('userRole');

      if (sessionStart && userRole) {
        const now = Date.now();
        const startTime = parseInt(sessionStart, 10);
        
        // Tentukan durasi absolut sesi
        const timeoutDuration = userRole === 'admin' 
          ? 24 * 60 * 60 * 1000  // 24 jam untuk admin
          : 2 * 60 * 60 * 1000;   // 2 jam untuk user

        if (now - startTime > timeoutDuration) {
          alert('Sesi Anda telah berakhir. Silakan login kembali.');
          await supabase.auth.signOut();
          // Hapus item localStorage setelah signOut
          localStorage.removeItem('sessionStartTime');
          localStorage.removeItem('userRole');
          router.push('/login');
        }
      }
    };

    // 1. Jalankan pengecekan *seketika* saat komponen dimuat
    checkSessionTimeout();

    // 2. Atur interval untuk pengecekan berkala (setiap menit)
    const intervalId = setInterval(checkSessionTimeout, 60 * 1000);

    // 3. Logika untuk reset timer pada aktivitas pengguna (sliding session) DIHAPUS
    
    // Bersihkan interval saat komponen dilepas
    return () => {
      clearInterval(intervalId);
    };
  }, [supabase, router]);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => fetchSessionData(session?.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Logika ini untuk mencegah masalah reset password, sudah benar
      const authFlowStatusRaw = localStorage.getItem('auth_flow_status');
      if (authFlowStatusRaw) {
        try {
          const authFlowStatus = JSON.parse(authFlowStatusRaw);
          const isRecent = (Date.now() - authFlowStatus.timestamp) < 10 * 60 * 1000;
          if (authFlowStatus.state === 'recovery_started' && isRecent && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchSessionData(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchSessionData, supabase]);
  
  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchSessionData(session?.user ?? null);
  }, [fetchSessionData, supabase]);

  const value = useMemo(() => ({ user, profile, notifications, refreshSession, loading }), [user, profile, notifications, refreshSession, loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}