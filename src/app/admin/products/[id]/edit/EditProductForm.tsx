'use client';

import { useActionState } from "react";      // 'useActionState' diimpor dari 'react'
import { useFormStatus } from "react-dom";    // 'useFormStatus' diimpor dari 'react-dom'
import { updateProduct } from "./actions"; // Pastikan path ini benar
import Link from "next/link";
import { Laptop } from "@/types";
import CurrencyInput from '@/components/CurrencyInput';
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-md ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}

export default function EditProductForm({ laptop }: { laptop: Laptop }) {
  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(updateProduct, initialState);

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={laptop.id} />
        <input type="hidden" name="current_image_url" value={laptop.image_url || ''} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
              <input id="name" type="text" name="name" defaultValue={laptop.name} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input id="brand" type="text" name="brand" defaultValue={laptop.brand} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
              <CurrencyInput
                id="price"
                name="price"
                defaultValue={laptop.price}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Saat Ini</label>
                {laptop.image_url ? (
                    <Image src={laptop.image_url} alt={laptop.name} width={120} height={120} className="rounded-lg border bg-gray-100 object-cover" />
                ) : (
                    <p className="text-xs text-gray-500">Tidak ada gambar.</p>
                )}
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar (Opsional)</label>
              <p className="text-xs text-gray-500 mb-2">Unggah gambar baru hanya jika Anda ingin menggantinya.</p>
              <input id="image" type="file" name="image" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="processor" className="block text-sm font-medium text-gray-700 mb-1">Prosesor</label>
              <input id="processor" type="text" name="processor" defaultValue={laptop.processor || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="ram" className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
              <input id="ram" type="text" name="ram" defaultValue={laptop.ram || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
             <div>
              <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">Penyimpanan</label>
              <input id="storage" type="text" name="storage" defaultValue={laptop.storage || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="screen_size" className="block text-sm font-medium text-gray-700 mb-1">Ukuran Layar</label>
              <input id="screen_size" type="text" name="screen_size" defaultValue={laptop.screen_size || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea id="description" name="description" defaultValue={laptop.description || ''} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"></textarea>
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
  );
}