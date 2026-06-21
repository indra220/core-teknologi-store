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

  // Efek untuk konfigurasi awal NProgress (hanya berjalan sekali saat mount)
  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false, // Disembunyikan agar lebih bersih (minimalis)
      trickleSpeed: 200,  // Kecepatan animasi loading mengalir
      minimum: 0.1,       // Persentase awal saat mulai
      easing: 'ease-out',
      speed: 400
    });
  }, []);

  return null; // Komponen ini hanya menangani logika, tidak merender UI apapun
}