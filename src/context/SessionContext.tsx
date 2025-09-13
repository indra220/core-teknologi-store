// src/context/SessionContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

// Definisikan tipe notifikasi di sini agar konsisten
interface AppNotification {
  id: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface SessionContextType {
  user: User | null;
  profile: Profile | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSessionData = useCallback(async (sessionUser: User | null) => {
    if (sessionUser) {
      setUser(sessionUser);

      // Ambil profil dan notifikasi secara bersamaan
      const [profileRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sessionUser.id).single(),
        supabase.from('notifications').select('*').eq('user_id', sessionUser.id).order('created_at', { ascending: false })
      ]);
      
      setProfile(profileRes.data as Profile | null);
      setNotifications(notificationsRes.data as AppNotification[] || []);

    } else {
      setUser(null);
      setProfile(null);
      setNotifications([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Ambil sesi awal saat komponen dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionData(session?.user ?? null);
    });

    // Dengarkan perubahan status autentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionData(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchSessionData, supabase]);
  
  // Fungsi ini yang akan kita panggil untuk refresh data secara manual
  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchSessionData(session?.user ?? null);
  };

  const value = { user, profile, notifications, refreshSession, loading };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}