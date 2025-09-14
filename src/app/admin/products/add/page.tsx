// src/app/admin/products/add/page.tsx
'use client';

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addProductWithVariants } from "./actions";
import Link from "@/components/NavigationLoader"; // Ganti Link
import CurrencyInput from '@/components/CurrencyInput';
import { TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import NProgress from 'nprogress'; // Impor NProgress

// ... (Interface Variant dan SubmitButton tidak berubah) ...
interface Variant {
  id: number;
  price: string;
  processor: string;
  ram: string;
  storage: string;
  screen_size: string;
  stock: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition ${pending ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
      {pending ? 'Menambahkan...' : 'Tambah Produk & Varian'}
    </button>
  );
}


export default function AddProductPage() {
  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(addProductWithVariants, initialState);
  
  const [variants, setVariants] = useState<Variant[]>([
    { id: Date.now(), price: '', processor: '', ram: '', storage: '', screen_size: '', stock: '0' }
  ]);

  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), price: '', processor: '', ram: '', storage: '', screen_size: '', stock: '0' }]);
  };

  const removeVariant = (id: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const handleVariantChange = (id: number, field: keyof Omit<Variant, 'id'>, value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Tambah Produk Baru</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Isi detail produk dasar dan tambahkan satu atau lebih varian.</p>
      </header>
      
      <form action={formAction} onSubmit={() => NProgress.start()}>
        {/* ... (Isi form tidak berubah) ... */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Produk Dasar</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk</label>
            <input 
              id="name" 
              type="text" 
              name="name" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
            <input 
              id="brand" 
              type="text" 
              name="brand" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar Utama</label>
            <input 
              id="image" 
              type="file" 
              name="image" 
              accept="image/*" 
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
            <textarea 
              id="description" 
              name="description" 
              rows={4} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Varian Produk</h2>
          {variants.map((variant, index) => (
            <div key={variant.id} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4 relative">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Varian {index + 1}</h3>
              {variants.length > 1 && (
                <button type="button" onClick={() => removeVariant(variant.id)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                  <TrashIcon className="w-5 h-5"/>
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga (Rp)</label>
                    <CurrencyInput 
                        id={`price-${variant.id}`} 
                        name={`price-${variant.id}`} 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                        value={variant.price}
                        onValueChange={(values) => handleVariantChange(variant.id, 'price', values.value)}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok</label>
                    <input 
                      type="number" 
                      value={variant.stock} 
                      onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                      min="0" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prosesor</label>
                    <input 
                      type="text" 
                      value={variant.processor} 
                      onChange={e => handleVariantChange(variant.id, 'processor', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RAM</label>
                    <input 
                      type="text" 
                      value={variant.ram} 
                      onChange={e => handleVariantChange(variant.id, 'ram', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Penyimpanan</label>
                    <input 
                      type="text" 
                      value={variant.storage} 
                      onChange={e => handleVariantChange(variant.id, 'storage', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ukuran Layar</label>
                    <input 
                      type="text" 
                      value={variant.screen_size} 
                      onChange={e => handleVariantChange(variant.id, 'screen_size', e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
              </div>
            </div>
          ))}
           <button type="button" onClick={addVariant} className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <PlusCircleIcon className="w-6 h-6"/>
            Tambah Varian Lain
          </button>
        </div>
        
        <input type="hidden" name="variants" value={JSON.stringify(variants.map(({id: _, ...rest}) => rest))} />

        {formState?.message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${formState.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {formState.message}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Link href="/admin/products" className="w-full text-center py-3 px-4 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Batal</Link>
            <SubmitButton />
        </div>
      </form>
    </div>
  );
}