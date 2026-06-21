// src/app/admin/AdminUserMenu.tsx
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { useSession } from '@/context/SessionContext';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import NProgress from 'nprogress';
import { 
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Hook untuk mendeteksi klik di luar dropdown
function useOnClickOutside(ref: RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default function AdminUserMenu() {
  const { user, profile } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  const handleLogout = async () => {
    setIsOpen(false);
    NProgress.start();
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('userRole');
    await supabase.auth.signOut();
    window.location.assign('/login?message=logout_success');
  };

  if (!user || !profile) return null;

  const displayName = profile.full_name || user.email || 'Admin';

  return (
    <div className="relative ml-2">
      <button 
        onClick={() => setIsOpen(prev => !prev)} 
        className="flex items-center gap-3 p-1 rounded-full sm:rounded-xl sm:pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none" 
        aria-label="User Menu"
      >
        <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 overflow-hidden flex items-center justify-center shadow-sm">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="Avatar" width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden sm:flex sm:flex-col sm:items-start">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{displayName}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Administrator</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={dropdownRef} 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            transition={{ duration: 0.2 }} 
            className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#111827] rounded-2xl shadow-xl z-50 border border-slate-200/60 dark:border-slate-800 overflow-hidden" 
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 sm:hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masuk Sebagai</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
            </div>
            
            <div className="py-2">                
                <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Keluar Sistem
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}