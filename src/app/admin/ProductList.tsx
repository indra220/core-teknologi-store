// src/app/admin/ProductList.tsx
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  ArchiveBoxIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  is_active?: boolean;
};

interface ProductListProps {
  initialProducts?: Product[] | null; 
}

export default function ProductList({ initialProducts = [] }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(initialProducts) ? initialProducts : [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return safeProducts;

    return safeProducts.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';
      
      return name.includes(term) || category.includes(term);
    });
  }, [initialProducts, searchTerm]);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col w-full overflow-hidden">
      
      {/* Header Tabel & Kontrol */}
      <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <Link 
          href="/admin/products/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#111827]"
        >
          <PlusIcon className="h-5 w-5 stroke-[2.5]" />
          Tambah Produk
        </Link>
      </div>

      {/* Kontainer Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px] table-auto">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800">
              <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-12">
                No
              </th>
              {/* Kolom Produk tidak lagi memiliki lebar tetap */}
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                Produk
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">
                Kategori
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 group text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ArrowsUpDownIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Harga
                </div>
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">
                Stok & Status
              </th>
              <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 relative rounded-xl border border-slate-200/70 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <ArchiveBoxIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      {/* PERBAIKAN PENTING: Penggunaan w-fit agar otomatis menyesuaikan isi konten */}
                      <div className="w-fit max-w-md">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug text-left">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono text-left">
                          ID: {product.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50">
                      {product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                        {product.stock}
                      </span>
                      {product.stock > 10 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          Tersedia
                        </span>
                      ) : product.stock > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                          Habis
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow transition-all"
                        title="Edit Produk"
                      >
                        <PencilSquareIcon className="h-4 w-4 stroke-2" />
                      </Link>
                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow transition-all"
                        title="Hapus Produk"
                        onClick={() => {
                           alert(`Hapus produk: ${product.name}`);
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
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <ArchiveBoxIcon className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada produk</h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      {searchTerm ? (
                        <span>Kami tidak dapat menemukan produk untuk kata kunci &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{searchTerm}</span>&quot;.</span>
                      ) : (
                        <span>Katalog Anda masih kosong. Mulai tambahkan produk pertama Anda sekarang.</span>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/10 rounded-b-2xl">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts?.length || 0}</span> produk
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