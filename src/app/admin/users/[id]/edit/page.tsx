import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Profile } from "@/types";
import EditUserForm from "./EditUserForm";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  
  if (!adminUser) { 
    redirect('/login'); 
  }

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
  if (adminProfile?.role !== 'admin') { 
    redirect('/'); 
  }

  // Ambil data pengguna yang akan diedit berdasarkan ID dari URL
  const { data: userToEdit, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single<Profile>();

  // Jika ada error atau pengguna tidak ditemukan
  if (error || !userToEdit) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-semibold">Gagal memuat data atau pengguna tidak ditemukan.</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke Daftar Pengguna
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Pengguna</h1>
        <p className="mt-2 text-lg text-gray-600">
          Anda sedang mengedit profil untuk <span className="font-semibold">{userToEdit.email}</span>
        </p>
      </header>
      <EditUserForm user={userToEdit} />
    </div>
  );
}