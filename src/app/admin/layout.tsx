// src/app/admin/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "@/components/notifications/NotificationBell";
import AdminUserMenu from "./AdminUserMenu";

import { SessionProvider } from "@/context/SessionContext";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
// Memastikan import memanggil file yang baru saja dibuat di atas
import AdminRealtimeNotifier from "./AdminRealtimeNotifier"; 

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <SessionProvider>
      <NotificationProvider>
        
        {/* Mengaktifkan Pendengar Notifikasi Real-time untuk Admin */}
        <AdminRealtimeNotifier />

        {/* HACK CSS ENTERPRISE: Menghilangkan padding RootLayout agar Dashboard bisa full-screen */}
        <style dangerouslySetInnerHTML={{ __html: `
          main:has(#admin-root) { 
            padding: 0 !important; 
            max-width: none !important; 
            margin: 0 !important; 
          }
        `}} />

        <div id="admin-root" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
          <Sidebar />
          
          <div className="pl-0 sm:pl-64 flex flex-col min-h-screen transition-all duration-300">
            
            {/* Top Navbar Admin */}
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-slate-200/70 bg-white/80 dark:border-slate-800/80 dark:bg-[#0B1120]/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
              
              {/* Bagian Kiri: Global Search */}
              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 relative">
                <GlobalSearch />
              </div>

              {/* Bagian Kanan: Lonceng Notifikasi & Menu Profil */}
              <div className="flex items-center gap-x-2 lg:gap-x-4">
                 <NotificationBell />

                 <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-700" aria-hidden="true"></div>

                 <AdminUserMenu />
              </div>
            </header>

            {/* Konten Utama Admin */}
            <main className="flex-1 w-full">
              <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">
                {children}
              </div>
            </main>

          </div>
        </div>

      </NotificationProvider>
    </SessionProvider>
  );
}