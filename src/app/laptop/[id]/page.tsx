// src/app/laptop/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import NavigationLoader from "@/components/NavigationLoader";
import ProductDetailClient from "./ProductDetailClient";
import { Suspense } from "react";
import type { Product } from "@/types";
import { unstable_cache } from "next/cache";

export const runtime = 'edge';

function ProductDetailSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="space-y-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-8"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mt-10"></div>
      </div>
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  return (
     <div className="bg-white dark:bg-gray-800 p-6 md:p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative w-full aspect-square max-w-lg">
            <Image
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">{product.brand}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
            {product.name}
          </h1>
          <p className="mt-6 text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-prose">
            {product.description || 'Tidak ada deskripsi rinci untuk produk ini.'}
          </p>
          <ProductDetailClient product={product} />
        </div>
      </div>
  );
}

// Fungsi cache menerima supabase client dan ID sebagai argumen
const getCachedProductById = unstable_cache(
  async (supabase, id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`*, product_variants ( * )`)
      .eq('id', id)
      .single();
    return { product: data as Product | null, error };
  },
  ['product-details'],
  {
    // Tagging dinamis berdasarkan ID
    tags: ['products'],
  }
);

export default async function DetailLaptopPage({ params: { id } }: { params: { id: string } }) {
  // Buat client di luar cache
  const supabase = await createClient();
  // Panggil fungsi cache dengan argumen
  const { product, error } = await getCachedProductById(supabase, id);

  if (error || !product || product.product_variants.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4">
      <div className="mb-8">
        <NavigationLoader 
          href="/products"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Kembali ke Daftar Produk
        </NavigationLoader>
      </div>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetails product={product} />
      </Suspense>
    </div>
  );
}