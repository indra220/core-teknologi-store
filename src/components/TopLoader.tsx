// src/components/TopLoader.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Efek ini akan berjalan setiap kali URL berubah, menandakan navigasi selesai.
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Efek untuk konfigurasi awal NProgress (hanya berjalan sekali)
  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false,
    });
  }, []);

  return null; // Komponen ini tidak merender UI apapun.
}