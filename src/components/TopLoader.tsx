// src/components/TopLoader.tsx

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// HAPUS: Komponen CustomLink tidak lagi diperlukan.

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Efek ini akan menghentikan loader setelah halaman selesai dimuat.
  // Logika ini sudah benar dan kita pertahankan.
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // --- PERBAIKAN UTAMA ADA DI SINI ---
  // Efek ini menambahkan event listener global untuk memulai loader secara otomatis.
  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleClick = (event: MouseEvent) => {
      // Cari elemen <a> terdekat dari elemen yang diklik
      const anchorElement = (event.target as HTMLElement).closest('a');

      // Jika tidak ada <a> atau tidak punya href, abaikan.
      if (!anchorElement || !anchorElement.href) {
        return;
      }

      // Dapatkan URL tujuan dan URL saat ini
      const targetUrl = new URL(anchorElement.href);
      const currentUrl = new URL(window.location.href);

      // Cek apakah ini link eksternal (beda domain)
      const isExternal = targetUrl.origin !== currentUrl.origin;
      if (isExternal) {
        return;
      }

      // Cek apakah ini hanya link hash di halaman yang sama
      const isHashLink = targetUrl.pathname === currentUrl.pathname && targetUrl.hash;
      if (isHashLink) {
        return;
      }
      
      // Cek apakah link akan membuka tab baru
      if (anchorElement.target === '_blank' || event.ctrlKey || event.metaKey) {
          return;
      }

      // Jika semua kondisi terpenuhi, ini adalah navigasi internal. Mulai loader!
      NProgress.start();
    };

    // Tambahkan event listener ke seluruh dokumen
    document.addEventListener('click', handleClick);

    // Jangan lupa untuk membersihkan event listener saat komponen dibongkar
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []); // Dependensi kosong berarti efek ini hanya berjalan sekali di sisi klien

  return null; // Komponen ini tidak me-render UI apa pun
}