// src/app/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import UserList from "./UserList";
// Hapus baris di bawah ini karena tidak digunakan
// import { Profile } from "@/types";

export const revalidate = 0; // Pastikan data selalu segar

const ITEMS_PER_PAGE = 8; // Tentukan jumlah item per halaman

export default async function ManageUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = await createClient();
  const currentPage = Number(searchParams?.page) || 1;
  const searchTerm = searchParams?.search || '';

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase.from('profiles').select('*', { count: 'exact' });

  if (searchTerm) {
    query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
  }

  const { data: profiles, error, count } = await query
    .order('full_name')
    .range(from, to);

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pengguna.</div>;
  }

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Manajemen Pengguna</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Kelola semua akun yang terdaftar di sistem.</p>
      </header>
      <UserList
        profiles={profiles || []}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={count || 0}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}