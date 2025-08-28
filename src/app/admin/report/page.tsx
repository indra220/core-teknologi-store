import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/'); // Jika bukan admin, tendang ke halaman utama
  }

  // Ambil data untuk ringkasan
  const { data: laptops } = await supabase.from('laptops').select('id');
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Laporan & Statistik</h1>
        <p className="mt-2 text-lg text-gray-600">Ringkasan data untuk Core Teknologi Store.</p>
        <Link href="/admin" className="text-blue-600 hover:underline mt-4 inline-block">&larr; Kembali ke Dashboard Admin</Link>
      </header>

      {/* Bagian Ringkasan */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-500">Total Produk</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">{laptops?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-500">Total Pengguna</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">{userCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-500">Pendapatan (Contoh)</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">Rp 0</p>
        </div>
      </section>
    </div>
  );
}