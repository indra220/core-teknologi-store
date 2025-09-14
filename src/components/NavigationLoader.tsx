// src/components/NavigationLoader.tsx
'use client';

import { forwardRef } from 'react';
import Link, { LinkProps } from 'next/link';
// Hapus impor 'useRouter' yang tidak terpakai
import NProgress from 'nprogress';

// Komponen ini akan menggantikan semua penggunaan <Link> dari 'next/link'
const NavigationLoader = forwardRef<HTMLAnchorElement, LinkProps & { children: React.ReactNode, className?: string }>(
  ({ href, onClick, children, ...props }, ref) => {
    // Hapus deklarasi 'router' yang tidak terpakai
    
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Jika link mengarah ke halaman yang sama, jangan lakukan apa-apa
      if (window.location.pathname === href) return;
      
      // Mulai progress bar
      NProgress.start();

      // Jika ada onClick prop asli, jalankan juga
      if (onClick) onClick(e);
    };

    return (
      <Link href={href} onClick={handleClick} {...props} ref={ref}>
        {children}
      </Link>
    );
  }
);

NavigationLoader.displayName = 'NavigationLoader';
export default NavigationLoader;