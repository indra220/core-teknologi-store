// src/components/TopLoader.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Konfigurasi NProgress yang disederhanakan tanpa spinner
    NProgress.configure({ 
      showSpinner: false, // <-- Pastikan spinner tidak ditampilkan
      easing: 'ease',
      speed: 500,
      trickle: true,
      trickleSpeed: 200,
      minimum: 0.1,
    });

    // Logika monkey-patching tetap sama untuk memastikan bar muncul otomatis
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      NProgress.start();
      return originalPushState.apply(window.history, args);
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
        NProgress.start();
        return originalReplaceState.apply(window.history, args);
    };

    const handlePopState = () => {
        NProgress.start();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}