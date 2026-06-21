// src/app/admin/Sidebar.tsx
'use client';

import Link from '@/components/NavigationLoader';
import { usePathname } from 'next/navigation';
import { 
    HomeIcon, 
    ShoppingBagIcon, 
    UsersIcon, 
    ChartBarIcon,
    InboxStackIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: HomeIcon },
  { href: '/admin/orders', label: 'Pesanan', icon: InboxStackIcon },
  { href: '/admin/products', label: 'Katalog Produk', icon: ShoppingBagIcon },
  { href: '/admin/users', label: 'Pengguna', icon: UsersIcon },
  { href: '/admin/report', label: 'Laporan', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isProductsActive = pathname === '/admin/products' || 
                             pathname.startsWith('/admin/products/add') || 
                             (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit'));
  const isOrdersActive = pathname === '/admin/orders' || pathname.startsWith('/admin/orders/');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0B1120] border-r border-slate-200/70 dark:border-slate-800/80 flex flex-col z-40">
      
      {/* Bahagian Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200/70 dark:border-slate-800/80">
        <Link href="/admin" className="flex items-center gap-3 group outline-none">
          <div className="w-9 h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-md">
            <span className="text-white dark:text-slate-900 font-extrabold text-lg tracking-tighter">CT</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">CoreTech</h1>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Workspace</span>
          </div>
        </Link>
      </div>
      
      {/* Navigasi Utama */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Menu Utama</div>
        
        {navLinks.map((link) => {
          const Icon = link.icon;
          let isActive = pathname === link.href;
          
          if (link.href === '/admin/products') isActive = isProductsActive;
          if (link.href === '/admin/orders') isActive = isOrdersActive;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 relative outline-none ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
              )}
              <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
              }`} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bahagian Bawah (Tetapan) */}
      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80 mt-auto">
         <button className="flex items-center gap-3 px-3 py-2 w-full rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors outline-none group">
            <Cog6ToothIcon className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
            <span>Tetapan Sistem</span>
         </button>
      </div>
    </aside>
  );
}