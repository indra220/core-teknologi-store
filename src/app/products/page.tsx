// src/app/products/page.tsx

import { createClient } from "@/lib/supabase/server";
import ProductList from "./ProductList";
import { Product } from "@/types";
import { unstable_cache } from "next/cache";

const getFilterCounts = (products: Product[]) => {
  const brandCounts = products.reduce((acc, product) => {
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
      .select(`*, laptops(*), product_variants(*)`)
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
    return (
      <div className="flex justify-center py-20">
        <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-xl border border-rose-200 text-sm font-semibold shadow-sm">
          Gagal memuat data produk.
        </div>
      </div>
    );
  }

  const { brands } = getFilterCounts(products || []);

  return (
    <section className="py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Katalog Produk
        </h1>
        <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
          Jelajahi koleksi perangkat komputasi premium kami. Temukan spesifikasi terbaik yang dirancang khusus untuk memenuhi kebutuhan profesional Anda.
        </p>
      </div>

      <ProductList 
        allProducts={products || []} 
        allBrands={brands}
      />
    </section>
  );
}