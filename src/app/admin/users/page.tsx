// src/app/admin/users/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserList from "./UserList";

export const revalidate = 60; // <-- UBAH DARI 0 MENJADI 60

export default async function ManageUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) { redirect('/login'); }

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'admin') { redirect('/'); }

  // Ambil semua data profil di server
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('full_name');

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pengguna.</div>
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Manajemen Pengguna</h1>
          <p className="mt-2 text-lg text-gray-600">Kelola semua akun yang terdaftar di sistem.</p>
        </div>
        <Link 
          href="/admin" 
          className="mt-4 sm:mt-0 bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-900"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </header>
      
      {/* Tampilkan komponen client dan kirim data profiles sebagai prop */}
      <UserList profiles={profiles || []} />
    </div>
  );
}