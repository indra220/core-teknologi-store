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
      router.replace(window.location.pathname, { scroll: false });
    } else if (message === 'logout_success') {
      showNotification('Logout berhasil!', 'info');
      router.replace(window.location.pathname, { scroll: false });
    } else if (message === 'update_success') {
      showNotification('Profil berhasil diperbarui!', 'success');
      router.replace(window.location.pathname, { scroll: false });
    } else if (message === 'reset_success') { // <-- TAMBAHKAN BLOK INI
      showNotification('Password berhasil direset! Silakan login kembali.', 'success');
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, showNotification, router]);

  return null;
}