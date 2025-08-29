'use client';

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Profile } from "@/types";

export default function ManageUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const supabase = createClient();
    
    const checkAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { window.location.href = '/'; return; }

      const { data } = await supabase.from('profiles').select('*').order('full_name');
      setProfiles(data || []);
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, []);

  const filteredProfiles = useMemo(() => 
    profiles.filter(profile =>
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.username.toLowerCase().includes(searchTerm.toLowerCase())
    ), [profiles, searchTerm]);

  const totalPages = Math.ceil(filteredProfiles.length / usersPerPage);
  const currentProfiles = filteredProfiles.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* --- PERBAIKAN UTAMA ADA DI BAGIAN HEADER INI --- */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="mt-2 text-lg text-gray-600">Kelola semua akun yang terdaftar di sistem.</p>
        </div>
        <Link 
          href="/admin" 
          className="mt-4 sm:mt-0 bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-900 transition duration-200 shadow-md"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </header>
      {/* ----------------------------------------------- */}

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text" 
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">Memuat data...</td></tr>
              ) : currentProfiles.length > 0 ? (
                currentProfiles.map((profile: Profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{profile.full_name || 'Tanpa Nama'}</div>
                      <div className="text-xs text-gray-500">{profile.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        profile.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link href={`/admin/users/${profile.id}/edit`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">Tidak ada pengguna yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={prevPage} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Sebelumnya
          </button>
          <span className="text-sm text-gray-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}