// src/components/notifications/StatusNotifier.tsx

'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNotification } from './NotificationProvider';

export default function StatusNotifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();

  useEffect(() => {
    const message = searchParams.get('message');
    
    if (message === 'login_success') {
      showNotification('Login berhasil! Selamat datang kembali.', 'success');
      // Membersihkan URL setelah notifikasi ditampilkan
      router.replace(window.location.pathname, { scroll: false });
    } else if (message === 'logout_success') {
      showNotification('Logout berhasil!', 'info');
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, showNotification, router]);

  // Komponen ini tidak me-render UI apa pun
  return null;
}