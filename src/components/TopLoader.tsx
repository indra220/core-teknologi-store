'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done(); // Selesaikan loading saat navigasi selesai
  }, [pathname, searchParams]);

  useEffect(() => {
    // Pengaturan global untuk NProgress
    NProgress.configure({ showSpinner: false });

    // Mencegat klik pada link untuk memulai loading bar
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;
      if (targetUrl !== currentUrl) {
        NProgress.start();
      }
    };
    
    // Mencegat pushState (digunakan oleh next/link)
    const handleMutation = () => {
        const anchorElements = document.querySelectorAll('a');
        anchorElements.forEach((anchor) => anchor.addEventListener('click', handleAnchorClick));
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });

    // Cleanup
    return () => {
      mutationObserver.disconnect();
      document.querySelectorAll('a').forEach((anchor) => anchor.removeEventListener('click', handleAnchorClick));
    };
  }, []);

  return null; // Komponen ini tidak me-render apapun
}