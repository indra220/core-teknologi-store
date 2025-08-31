import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Profile } from "@/types";
import EditUserForm from "./EditUserForm";
import { Suspense } from "react";

// Komponen Skeleton untuk Form Edit
const EditFormSkeleton = () => (
  <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 animate-pulse">
    <div className="space-y-6">
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

// Komponen Data Asynchronous
async function UserEditData({ userId }: { userId: string }) {
  const supabase = await createClient();
  
  const { data: userToEdit, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>();

  if (error || !userToEdit) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-semibold">Gagal memuat data atau pengguna tidak ditemukan.</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline mt-6 inline-block">
          &larr; Kembali ke Daftar Pengguna
        </Link>
      </div>
    );
  }

  return <EditUserForm user={userToEdit} />;
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  
  if (!adminUser) { redirect('/login'); }

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') { redirect('/'); }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Pengguna</h1>
        <p className="mt-2 text-lg text-gray-600">
          Memuat data untuk pengguna...
        </p>
      </header>
      <Suspense fallback={<EditFormSkeleton />}>
        <UserEditData userId={params.id} />
      </Suspense>
    </div>
  );
}