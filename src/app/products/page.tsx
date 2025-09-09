// src/app/products/page.tsx

import { createClient } from "@/lib/supabase/server";
import ProductList from "./ProductList";
import { Laptop } from "@/types"; // 1. Impor tipe data Laptop

export const revalidate = 3600;

const getFilterCounts = (laptops: Laptop[]) => { // 2. Tentukan tipe data untuk parameter
  const brandCounts = laptops.reduce((acc, laptop) => {
    acc[laptop.brand] = (acc[laptop.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return {
    brands: Object.entries(brandCounts).map(([brand, count]) => ({ brand, count })).sort((a,b) => a.brand.localeCompare(b.brand))
  };
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: laptops, error: laptopsError } = await supabase
    .from('laptops')
    .select('*')
    .order('name', { ascending: true });
    
  if (laptopsError) {
    return <p className="text-center text-red-500 py-10">Gagal memuat data produk.</p>;
  }

  // 3. Pastikan laptops yang dikirim memiliki tipe yang benar
  const { brands } = getFilterCounts(laptops || []);

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
        allLaptops={laptops || []} 
        allBrands={brands}
      />
    </section>
  );
}