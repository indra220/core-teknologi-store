// src/app/products/page.tsx

import { createClient } from "@/lib/supabase/server";
import ProductList from "./ProductList";
// Perbaikan: Import Laptops bukan Product
import { Laptops } from "@/types";
import { unstable_cache } from "next/cache";

// Perbaikan: Ubah parameter menjadi Laptops[]
const getFilterCounts = (products: Laptops[]) => {
  const brandCounts = products.reduce((acc, product) => {
    acc[product.brand] = (acc[product.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    brands: Object.entries(brandCounts).map(([brand, count]) => ({ brand, count })).sort((a,b) => a.brand.localeCompare(b.brand))
  };
};

const getCachedProducts = unstable_cache(
  async (supabase) => {
    const { data, error } = await supabase
      .from('products')
      .select(`*, product_variants ( * )`)
      .order('name', { ascending: true });
    
    // Perbaikan: Cast data menjadi Laptops[]
    return { products: data as Laptops[] | null, error };
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