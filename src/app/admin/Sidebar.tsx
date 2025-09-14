// src/app/admin/Sidebar.tsx
'use client';

import Link from '@/components/NavigationLoader'; // <-- PERBAIKAN DI SINI
import { usePathname } from 'next/navigation';
import { 
    HomeIcon, 
    ShoppingBagIcon, 
    UsersIcon, 
    ChartBarIcon,
    InboxStackIcon 
} from '@heroicons/react/24/outline';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
  { href: '/admin/orders', label: 'Manajemen Pesanan', icon: InboxStackIcon },
  { href: '/admin/products', label: 'Manajemen Produk', icon: ShoppingBagIcon },
  { href: '/admin/users', label: 'Manajemen Pengguna', icon: UsersIcon },
  { href: '/admin/report', label: 'Laporan & Statistik', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isProductsActive = pathname === '/admin/products' || 
                           pathname.startsWith('/admin/products/add') || 
                           pathname.startsWith('/admin/products/') && pathname.endsWith('/edit');
  
  const isOrdersActive = pathname === '/admin/orders' || pathname.startsWith('/admin/orders/');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/admin">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Core Teknologi</p>
        </Link>
      </div>
      
      <nav className="flex-grow p-4 space-y-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          let isActive = pathname === link.href;
          if (link.href === '/admin/products') isActive = isProductsActive;
          if (link.href === '/admin/orders') isActive = isOrdersActive;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        
      </div>
    </aside>
  );
}