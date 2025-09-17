// src/app/admin/products/[id]/edit/EditProductForm.tsx
'use client';

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "@/components/NavigationLoader";
import CurrencyInput from '@/components/CurrencyInput';
import { TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { updateProductAndVariants } from "./actions";
import type { Product, ProductVariant } from "@/types";
import NProgress from 'nprogress';

type ClientVariant = Partial<ProductVariant> & { tempId: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`w-full py-3 px-4 rounded-lg font-semibold text-white tracking-wide transition ${pending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </button>
  );
}


export default function EditProductForm({ product }: { product: Product }) {
  const initialState = { message: null, type: null };
  const [formState, formAction] = useActionState(updateProductAndVariants, initialState);
  
  const [variants, setVariants] = useState<ClientVariant[]>([]);
  const [variantsToDelete, setVariantsToDelete] = useState<string[]>([]);

  useEffect(() => {
    setVariants(product.product_variants.map(v => ({ ...v, tempId: Math.random() })));
  }, [product]);

  // --- PERBAIKAN TOPLOADER DI SINI ---
  useEffect(() => {
    if (formState?.message) {
      NProgress.done();
    }
  }, [formState]);
  // --- AKHIR PERBAIKAN ---

  const addVariant = () => {
    setVariants([...variants, {
      tempId: Date.now(),
      price: 0,
      processor: '',
      ram: '',
      storage: '',
      screen_size: '',
      stock: 0
    }]);
  };

  const removeVariant = (variant: ClientVariant) => {
    if (variants.length <= 1) {
      alert("Produk harus memiliki setidaknya satu varian.");
      return;
    }
    if (variant.id) {
      setVariantsToDelete([...variantsToDelete, variant.id]);
    }
    setVariants(variants.filter(v => v.tempId !== variant.tempId));
  };

  const handleVariantChange = (tempId: number, field: keyof Omit<ClientVariant, 'id' | 'tempId' | 'product_id' | 'created_at'>, value: string | number) => {
    setVariants(variants.map(v => v.tempId === tempId ? { ...v, [field]: value } : v));
  };
  
  return (
    <form action={formAction} onSubmit={() => NProgress.start()}>
      <input type="hidden" name="productId" value={product.id} />
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Produk Dasar</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk</label>
          <input id="name" type="text" name="name" defaultValue={product.name} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
          <input id="brand" type="text" name="brand" defaultValue={product.brand} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
         <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
            <textarea id="description" name="description" rows={4} defaultValue={product.description || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Manajemen Varian & Stok</h2>
        {variants.map((variant, index) => (
          <div key={variant.tempId} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4 relative">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Varian {index + 1}</h3>
            <button type="button" onClick={() => removeVariant(variant)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
              <TrashIcon className="w-5 h-5"/>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga (Rp)</label>
                  <CurrencyInput 
                      id={`price-${variant.tempId}`} name={`price-${variant.tempId}`} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                      defaultValue={variant.price}
                      onValueChange={(values) => handleVariantChange(variant.tempId, 'price', values.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok</label>
                  <input type="number" value={variant.stock || 0} onChange={e => handleVariantChange(variant.tempId, 'stock', Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" min="0" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prosesor</label>
                  <input type="text" value={variant.processor || ''} onChange={e => handleVariantChange(variant.tempId, 'processor', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RAM</label>
                  <input type="text" value={variant.ram || ''} onChange={e => handleVariantChange(variant.tempId, 'ram', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Penyimpanan</label>
                  <input type="text" value={variant.storage || ''} onChange={e => handleVariantChange(variant.tempId, 'storage', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ukuran Layar</label>
                  <input type="text" value={variant.screen_size || ''} onChange={e => handleVariantChange(variant.tempId, 'screen_size', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          <PlusCircleIcon className="w-6 h-6"/>
          Tambah Varian Baru
        </button>
      </div>
      
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="variantsToDelete" value={JSON.stringify(variantsToDelete)} />

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
  );
}