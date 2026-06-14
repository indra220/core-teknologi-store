// src/app/admin/ProductList.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "@/components/NavigationLoader"; 
import Image from 'next/image';
import { useNotification } from "@/components/notifications/NotificationProvider";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

type ExtendedProduct = Omit<Product, 'catagory'> & {
    category?: string;
    catagory?: string;
};

export default function AdminProductList() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Relasi Paralel: Memanggil laptops dan product_variants secara sejajar
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        laptops ( * ),
        product_variants ( * )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Gagal memuat produk:", error);
      showNotification("Gagal memuat daftar produk", "error");
    } else {
      setProducts((data as unknown as ExtendedProduct[]) || []);
    }
    setLoading(false);
  }, [showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Produk & Varian</h2>
        <Link href="/admin/products/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
          + Tambah Produk
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        {products.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Produk
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jumlah Varian
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Stok
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const laptopInfo = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;
                
                const variantsData = product.product_variants || [];
                const totalStock = variantsData.reduce((sum, v) => sum + (v.stock || 0), 0);
                const variantCount = variantsData.length;

                return (
                  <tr key={product.id} className="transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/products/${product.id}`} className="flex items-center group">
                        <div className="flex-shrink-0 h-12 w-12 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors">
                          <Image 
                            src={laptopInfo?.image_url || '/placeholder.png'} 
                            alt={laptopInfo?.name || 'Produk'} 
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {laptopInfo?.name || 'Nama Tidak Tersedia'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {laptopInfo?.brand || '-'}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs uppercase tracking-wider">
                        {product.category || product.catagory || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400 font-semibold">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        {variantCount} Varian
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">
                      <span className={`px-3 py-1 rounded-lg ${totalStock > 0 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'}`}>
                        {totalStock} Unit
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium flex justify-center gap-3">
                      <Link 
                        href={`/admin/products/${product.id}`} 
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                      >
                        Detail
                      </Link>
                      
                      <Link 
                        href={`/admin/products/${product.id}/edit`} 
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg font-medium">Belum ada produk</p>
            <p className="mt-1 text-sm">Mulai dengan menambahkan produk baru ke katalog Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}