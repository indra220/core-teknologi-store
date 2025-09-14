// src/app/admin/ProductList.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "@/components/NavigationLoader"; // <-- PERBAIKAN DI SINI
import Image from 'next/image';
import { useNotification } from "@/components/notifications/NotificationProvider";
import { createClient } from "@/lib/supabase/client";

interface ProductWithStats {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  variant_count: number;
  total_stock: number;
}

export default function AdminProductList() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_products_with_stats');
    
    if (error) {
      console.error("Gagal memuat statistik produk:", error);
      showNotification("Gagal memuat produk", "error");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">Memuat daftar produk...</p>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daftar Produk</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total {products.length} produk ditemukan.</p>
        </div>
        <Link href="/admin/products/add" className="bg-green-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-700 transition">
          + Tambah Produk
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        {products.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
             <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produk
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Jumlah Varian
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Stok
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 relative">
                        <Image src={product.image_url || '/placeholder.png'} alt={product.name} fill className="rounded-lg object-cover" sizes="48px" />
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
                    {product.variant_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100 font-semibold">
                    {product.total_stock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-400 mr-4">
                      Kelola Varian
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>Belum ada produk yang ditambahkan.</p>
          </div>
        )}
      </div>
    </section>
  );
}