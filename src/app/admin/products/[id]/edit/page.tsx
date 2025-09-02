import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Laptop } from "@/types";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/login'); }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { redirect('/'); }

  const { data: laptop } = await supabase.from('laptops').select('*').eq('id', params.id).single<Laptop>();

  if (!laptop) {
    return (
      <div className="text-center py-10">
        <p>Produk tidak ditemukan.</p>
        <Link href="/admin" className="text-blue-600">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Produk</h1>
        <p className="mt-2 text-lg text-gray-600">Anda sedang mengedit: <span className="font-semibold">{laptop.name}</span></p>
      </header>
      <EditProductForm laptop={laptop} />
    </div>
  );
}