'use client';

import { useActionState } from "react";      // 'useActionState' diimpor dari 'react'
import { useFormStatus } from "react-dom";    // 'useFormStatus' diimpor dari 'react-dom'
import { addProduct } from "./actions";
import Link from "next/link";
import CurrencyInput from '@/components/CurrencyInput';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md ${pending ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
      {pending ? 'Menambahkan...' : 'Tambah Produk'}
    </button>
  );
}

export default function AddProductPage() {
  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(addProduct, initialState);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tambah Produk Baru</h1>
        <p className="mt-2 text-lg text-gray-600">Isi detail produk laptop yang akan dijual.</p>
      </header>
      
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom Kiri */}
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input id="name" type="text" name="name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input id="brand" type="text" name="brand" required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                <CurrencyInput
                  id="price"
                  name="price"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Gambar Produk</label>
                <input id="image" type="file" name="image" required accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
            </div>
            {/* Kolom Kanan */}
            <div className="space-y-6">
              <div>
                <label htmlFor="processor" className="block text-sm font-medium text-gray-700 mb-1">Prosesor </label>
                <input id="processor" type="text" name="processor" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ram" className="block text-sm font-medium text-gray-700 mb-1">RAM </label>
                <input id="ram" type="text" name="ram" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
               <div>
                <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">Penyimpanan </label>
                <input id="storage" type="text" name="storage" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="screen_size" className="block text-sm font-medium text-gray-700 mb-1">Ukuran Layar </label>
                <input id="screen_size" type="text" name="screen_size" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi </label>
            <textarea id="description" name="description" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          
          {formState?.message && (
            <div className={`p-3 rounded-lg text-sm ${formState.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {formState.message}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/admin" className="w-full text-center py-3 px-4 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold transition-colors">
              Batal
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}