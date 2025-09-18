// src/app/products/page.tsx

import { createClient } from "@/lib/supabase/server";
import ProductList from "./ProductList";
import { Product } from "@/types";
import { unstable_cache } from "next/cache";

const getFilterCounts = (products: Product[]) => {
  const brandCounts = products.reduce((acc, product) => {
    acc[product.brand] = (acc[product.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    brands: Object.entries(brandCounts).map(([brand, count]) => ({ brand, count })).sort((a,b) => a.brand.localeCompare(b.brand))
  };
};

// Fungsi cache menerima 'supabase' sebagai argumen
const getCachedProducts = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase
      .from('products')
      .select(`*, product_variants ( * )`)
      .order('name', { ascending: true });
    
    // Kembalikan data dan error untuk ditangani di komponen
    return { products: data as Product[] | null, error };
  },
  ['all-products'], // Kunci cache
  {
    tags: ['products'], // Tag untuk revalidasi
  }
);

export default async function ProductsPage() {
  const supabase = await createClient();

  // Panggil fungsi cache dengan melemparkan supabase client
  const { products, error: productsError } = await getCachedProducts(supabase);
    
  if (productsError) {
    return <p className="text-center text-red-500 py-10">Gagal memuat data produk.</p>;
  }

  const { brands } = getFilterCounts(products || []);

  return (
    <section className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
          Semua Produk
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
          Jelajahi semua koleksi laptop terbaik yang kami tawarkan.
        </p>
      </div>

      <ProductList 
        allProducts={products || []} 
        allBrands={brands}
      />
    </section>
  );
}