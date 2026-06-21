// src/app/admin/AdminRealtimeNotifier.tsx
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { refreshAdminBell } from './bellActions';

export default function AdminRealtimeNotifier() {
  const supabase = createClient();

  useEffect(() => {
    // Membuka saluran komunikasi real-time ke tabel orders
    const channel = supabase
      .channel('admin-new-orders-channel')
      .on(
        'postgres_changes',
        { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'orders' 
        },
        async (payload) => {
          // Menangkap ID pesanan yang baru saja diciptakan
          const newOrderId = payload.new?.id;

          // Memperbarui Lonceng Notifikasi secara senyap
          await refreshAdminBell(newOrderId);
        }
      )
      .subscribe();

    // Membersihkan saluran saat komponen dilepas
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Pendengar Senyap murni (Tidak ada UI yang dikembalikan)
  return null; 
}