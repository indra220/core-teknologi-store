import { createClient } from "@/lib/supabase/server";
import { Laptop } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from 'next/image';

export default async function AdminDashboardPage() {
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
    redirect('/dashboard');
  }

  // PERBAIKAN: Hapus deklarasi 'laptopsError'
  const { data: laptops } = await supabase.from('laptops').select('*');
  
  // PERBAIKAN: Hapus deklarasi 'usersError'
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  return (
    <div className="max-w-7xl mx-auto py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Selamat datang, Admin! Kelola semua data dari sini.</p>
      </header>

      {/* Bagian Ringkasan */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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

      {/* Bagian Manajemen Produk */}
      <section className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <Link href="/admin/products/add" className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200">
            + Tambah Produk
          </Link>
        </div>
        
        {/* Tabel Produk */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {laptops?.map((laptop: Laptop) => (
                <tr key={laptop.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Image src={laptop.image_url || '/placeholder.png'} alt={laptop.name} width={40} height={40} className="rounded-md object-cover"/>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{laptop.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laptop.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(laptop.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Edit</a>
                    <a href="#" className="text-red-600 hover:text-red-900 ml-4">Hapus</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}