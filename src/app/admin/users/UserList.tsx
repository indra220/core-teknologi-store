// src/app/admin/users/UserList.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  PencilSquareIcon, 
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export type User = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

interface UserListProps {
  initialUsers?: User[] | null; 
}

export default function UserList({ initialUsers = [] }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Logika pencarian yang ditingkatkan (Robust Search & Null Safety)
  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(initialUsers) ? initialUsers : [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return safeUsers;

    return safeUsers.filter((user) => {
      const username = user.username?.toLowerCase() || '';
      const fullName = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || ''; 
      
      return (
        username.includes(term) ||
        fullName.includes(term) ||
        email.includes(term)
      );
    });
  }, [initialUsers, searchTerm]);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col w-full overflow-hidden">
      
      {/* Header Tabel & Kontrol */}
      <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        {/* Tombol Tambah Pengguna bisa ditambahkan di sini jika diperlukan di masa depan */}
      </div>

      {/* Kontainer Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800">
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pengguna
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Alamat Email
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Role
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar Bulat (Standard UI untuk Pengguna) */}
                      <div className="h-11 w-11 shrink-0 relative rounded-full border border-slate-200/70 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                         <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                         </span>
                      </div>
                      <div className="min-w-[150px] max-w-[250px]">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                          {user.full_name || 'Tanpa Nama'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          @{user.username || 'unknown'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {user.email || '-'}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      user.role === 'admin' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow transition-all"
                        title="Edit Pengguna"
                      >
                        <PencilSquareIcon className="h-4 w-4 stroke-2" />
                      </Link>
                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow transition-all"
                        title="Hapus Pengguna"
                        onClick={() => {
                          alert(`Hapus pengguna: ${user.full_name || user.username}`);
                        }}
                      >
                        <TrashIcon className="h-4 w-4 stroke-2" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <UsersIcon className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada pengguna</h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      {searchTerm ? (
                        <span>Kami tidak dapat menemukan pengguna untuk kata kunci &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{searchTerm}</span>&quot;.</span>
                      ) : (
                        <span>Belum ada pengguna yang terdaftar di dalam sistem.</span>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Selaras dengan tabel produk) */}
      <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10 rounded-b-2xl">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-semibold text-slate-900 dark:text-white">{filteredUsers?.length || 0}</span> pengguna
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-400 cursor-not-allowed">
            Sebelumnya
          </button>
          <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all active:scale-95">
            Selanjutnya
          </button>
        </div>
      </div>

    </div>
  );
}