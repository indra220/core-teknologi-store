// src/app/products/page.tsx

import { createClient } from "@/lib/supabase/server";
import ProductList from "./ProductList";
import { Product } from "@/types";
import { unstable_cache } from "next/cache";

const getFilterCounts = (products: Product[]) => {
  const brandCounts = products.reduce((acc, product) => {
    // Perbaikan: Ambil brand dari relasi laptops
    const laptopData = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;
    const brand = laptopData?.brand;
    
    if (brand) {
      acc[brand] = (acc[brand] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    brands: Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a,b) => a.brand.localeCompare(b.brand))
  };
};

const getCachedProducts = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase
      .from('products')
      // Perbaikan: JOIN ke kedua tabel anak (laptops dan product_variants)
      .select(`*, laptops(*), product_variants(*)`)
      // Perbaikan: Urutkan berdasarkan created_at karena 'name' sekarang ada di tabel laptops
      .order('created_at', { ascending: false });
    
    return { products: data as Product[] | null, error };
  },
  ['all-products'], 
  {
    tags: ['products'], 
  }
);

export default async function ProductsPage() {
  const supabase = await createClient();

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