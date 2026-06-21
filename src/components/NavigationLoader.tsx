// src/components/NavigationLoader.tsx
'use client';

import { forwardRef } from 'react';
import Link, { LinkProps } from 'next/link';
import NProgress from 'nprogress';

const NavigationLoader = forwardRef<HTMLAnchorElement, LinkProps & { children: React.ReactNode, className?: string }>(
  ({ href, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (window.location.pathname === href) return;
      NProgress.start();
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