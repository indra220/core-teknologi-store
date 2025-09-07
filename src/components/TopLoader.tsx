// src/components/TopLoader.tsx

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import Link from 'next/link';

// Komponen Link kustom yang akan memicu NProgress
export const CustomLink = (props: React.ComponentProps<typeof Link>) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Cek jika ini bukan navigasi ke halaman yang sama
    if (props.href !== window.location.pathname) {
      NProgress.start();
    }
    if (props.onClick) {
      props.onClick(event);
    }
  };

  return <Link {...props} onClick={handleClick} />;
};


export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Efek ini akan menghentikan loader setelah halaman selesai dimuat
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Efek ini hanya berjalan sekali untuk konfigurasi
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
  }, []);

  return null; // Komponen ini tidak me-render UI apa pun
}