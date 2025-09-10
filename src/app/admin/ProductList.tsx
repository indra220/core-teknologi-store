// src/app/admin/ProductList.tsx

'use client';

import { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { Laptop } from "@/types";
import { deleteProduct } from './actions';
import { useNotification } from "@/components/notifications/NotificationProvider";

export default function AdminProductList({ initialLaptops }: { initialLaptops: Laptop[] }) {
  const [laptops, setLaptops] = useState<Laptop[]>(initialLaptops);
  const { showNotification } = useNotification();

  const handleDelete = async (productId: string, imageUrl: string | null) => {
    if (window.confirm("Anda yakin ingin menghapus produk ini? Aksi ini tidak bisa dibatalkan.")) {
      const result = await deleteProduct(productId, imageUrl);
      showNotification(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setLaptops(prevLaptops => prevLaptops.filter(laptop => laptop.id !== productId));
      }
    }
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-sm text-gray-500 mt-1">Tambah, edit, atau hapus produk di toko Anda.</p>
        </div>
        <Link href="/admin/products/add" className="bg-green-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-green-700 transition">
          + Tambah Produk
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        {laptops.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                {/* --- PERUBAHAN DI SINI: Kolom Sticky --- */}
                <th scope="col" className="sticky right-[248px] bg-gray-50 w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th scope="col" className="sticky right-[128px] bg-gray-50 w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th scope="col" className="sticky right-0 bg-gray-50 w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {laptops.map((laptop: Laptop) => (
                <tr key={laptop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 relative">
                        <Image src={laptop.image_url || '/placeholder.png'} alt={laptop.name} fill className="rounded-lg object-cover" sizes="48px" />
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{laptop.name}</div>
                        <div className="text-xs text-gray-500 truncate">{laptop.processor} / {laptop.ram} / {laptop.storage}</div>
                      </div>
                    </div>
                  </td>
                  {/* --- PERUBAHAN DI SINI: Kolom Sticky --- */}
                  <td className="sticky right-[248px] bg-white hover:bg-gray-50 w-40 px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {laptop.brand}
                  </td>
                  <td className="sticky right-[128px] bg-white hover:bg-gray-50 w-48 px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(laptop.price)}
                  </td>
                  <td className="sticky right-0 bg-white hover:bg-gray-50 w-32 px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <Link href={`/admin/products/${laptop.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                    <button 
                      onClick={() => handleDelete(laptop.id, laptop.image_url)}
                      type="button" 
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="mb-4">Belum ada produk yang ditambahkan.</p>
          </div>
        )}
      </div>
    </section>
  );
}