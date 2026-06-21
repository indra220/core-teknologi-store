// src/app/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import UserList from "./UserList";
import { unstable_cache } from "next/cache";
import { Profile } from "@/types";

const getCachedUsers = unstable_cache(
  async (supabase) => {
    // PERBAIKAN: Memfilter data agar yang ditarik HANYA role 'user'
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user') 
      .order('full_name', { ascending: true });
      
    return { profiles: data as Profile[] | null, error };
  },
  ['all-users'],
  {
    tags: ['users'],
  }
);

export default async function ManageUsersPage() {
  const supabase = await createClient();

  const { profiles, error } = await getCachedUsers(supabase);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
          <p className="font-semibold text-sm">Gagal memuat data pengguna.</p>
          <p className="text-xs mt-1 opacity-80">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Pengguna</h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400">Kelola semua akun pelanggan yang terdaftar di sistem Anda.</p>
      </header>
      
      <UserList initialUsers={profiles || []} />
    </div>
  );
}