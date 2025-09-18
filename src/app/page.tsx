// src/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from '@/components/NavigationLoader';
import Image from 'next/image';
import { Product } from "@/types";
import { redirect } from 'next/navigation';
import { unstable_cache } from "next/cache"; // <-- Impor unstable_cache

export const runtime = 'edge';

type OrderItemSummary = {
  product_id: string;
  quantity: number;
};

// Bungkus keseluruhan logika fetching dalam satu fungsi cache
const getCachedBestSellingProducts = unstable_cache(
  async (limit: number) => {
    const supabase = await createClient();
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity');
      
    if (orderItemsError || !orderItems) {
      console.error("Gagal mengambil data pesanan:", orderItemsError);
      return [];
    }

    const productSales = (orderItems as OrderItemSummary[]).reduce((acc: Record<string, number>, item: OrderItemSummary) => {
      if (item.product_id) {
        acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
      }
      return acc;
    }, {});

    const topProductIds = Object.entries(productSales)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    if (topProductIds.length === 0) {
      const { data: latestProducts } = await supabase
        .from('products')
        .select(`*, product_variants(price)`)
        .order('created_at', { ascending: false })
        .limit(limit);
      return latestProducts || [];
    }

    const { data: bestSellers, error: bestSellersError } = await supabase
      .from('products')
      .select(`*, product_variants(price)`)
      .in('id', topProductIds);

    if (bestSellersError) {
      console.error("Gagal mengambil produk terlaris:", bestSellersError);
      return [];
    }
    
    return bestSellers.sort((a: Product, b: Product) => productSales[b.id] - productSales[a.id]);
  },
  ['best-selling-products'], // Kunci cache unik
  {
    tags: ['products'], // Tag untuk revalidasi
  }
);


export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      redirect('/admin');
    }
  }

  const products = await getCachedBestSellingProducts(4);

  return (
    <section className="py-8">
      
      <div className="text-center py-16 sm:py-24 px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
          Pusat Teknologi Terbaik.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
          Temukan laptop impian Anda dengan performa tak tertandingi dan penawaran eksklusif hanya di Core Teknologi.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/products" className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg">
            Lihat Semua Produk
          </Link>
        </div>
      </div>

      <div id="produk" className="pt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50">Produk Unggulan Kami</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Teknologi terlaris yang kami pilih khusus untuk Anda.</p>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product: Product) => {
              const displayPrice = product.product_variants && product.product_variants.length > 0
                ? Math.min(...product.product_variants.map(v => v.price))
                : 0;

              return (
                <div key={product.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-gray-950 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-gray-700 flex flex-col">
                  <Link href={`/laptop/${product.id}`} className="block relative aspect-video overflow-hidden">
                    <Image
                      src={product.image_url || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </Link>
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{product.brand}</p>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate mt-1 flex-grow">
                      <Link href={`/laptop/${product.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{product.name}</Link>
                    </h3>
                    <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-4">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(displayPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">Belum ada produk unggulan untuk ditampilkan.</p>
        )}
      </div>
    </section>
  );
}