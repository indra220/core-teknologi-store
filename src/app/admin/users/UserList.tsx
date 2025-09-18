// src/app/admin/users/UserList.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Profile } from "@/types";
import Link from "@/components/NavigationLoader";
import PaginationControls from '@/components/PaginationControls'; // <-- Impor komponen baru

// --- Komponen & Ikon (tidak berubah) ---
const Avatar = ({ name }: { name: string }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colorIndex = name ? name.charCodeAt(0) % 5 : 0;
  const colors = [ 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800', 'bg-indigo-100 text-indigo-800' ];
  return ( <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colors[colorIndex]}`}>{initial}</div> );
};
const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
// --- END Komponen & Ikon ---

interface UserListProps {
  profiles: Profile[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  itemsPerPage: number;
}

export default function UserList({ profiles, currentPage, totalPages, totalUsers, itemsPerPage }: UserListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const handleSearch = (term: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (term) {
      current.set('search', term);
    } else {
      current.delete('search');
    }
    current.set('page', '1'); // Reset ke halaman pertama saat mencari
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Daftar Pengguna</h2>
        <div className="relative w-full sm:max-w-xs">
          <input 
            type="text" 
            placeholder="Cari nama, email, username..."
            defaultValue={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pengguna</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.length > 0 ? (
              profiles.map((profile: Profile) => (
                <tr key={profile.id} className="hover:bg-indigo-50/50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0"><Avatar name={profile.full_name || profile.username} /></div><div className="ml-4"><div className="text-sm font-bold text-gray-900">{profile.full_name || 'Tanpa Nama'}</div><div className="text-xs text-gray-500">{profile.email}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{profile.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full ${profile.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{profile.role}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><Link href={`/admin/users/${profile.id}/edit`} className="text-white bg-indigo-600 hover:bg-indigo-700 font-semibold py-2 px-4 rounded-lg">Edit</Link></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500">Tidak ada pengguna yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalUsers}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}