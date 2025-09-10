// src/app/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import UserList from "./UserList";

export const revalidate = 60;

export default async function ManageUsersPage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('full_name');

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pengguna.</div>
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Manajemen Pengguna</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Kelola semua akun yang terdaftar di sistem.</p>
      </header>
      <UserList profiles={profiles || []} />
    </div>
  );
}