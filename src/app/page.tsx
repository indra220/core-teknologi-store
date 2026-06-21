// src/app/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from '@/components/NavigationLoader';
import Image from 'next/image';
import { Product as BaseProduct } from "@/types";
import { redirect } from 'next/navigation';
import { unstable_cache } from "next/cache";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/solid";

export const runtime = 'edge';

type Product = BaseProduct & { price?: number };

type OrderItemSummary = {
  product_id: string;
  quantity: number;
};

const getCachedBestSellingProducts = unstable_cache(
  async (supabase, limit: number) => {
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity');
      
    if (orderItemsError || !orderItems) return [];

    const productSales = (orderItems as OrderItemSummary[]).reduce((acc: Record<string, number>, item: OrderItemSummary) => {
      if (item.product_id) acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
      return acc;
    }, {});

    const topProductIds = Object.entries(productSales)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    if (topProductIds.length === 0) {
      const { data: latestProducts } = await supabase
        .from('products')
        .select(`*, laptops(*), product_variants(*)`)
        .order('created_at', { ascending: false })
        .limit(limit);
      return (latestProducts as unknown as Product[]) || [];
    }

    const { data: bestSellers, error: bestSellersError } = await supabase
      .from('products')
      .select(`*, laptops(*), product_variants(*)`)
      .in('id', topProductIds);

    if (bestSellersError) return [];
    
    return (bestSellers as unknown as Product[]).sort((a: Product, b: Product) => productSales[b.id] - productSales[a.id]);
  },
  ['best-selling-products'], 
  { tags: ['products'] }
);

export default async function HomePage() {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'admin') redirect('/admin');
  }

  const products = await getCachedBestSellingProducts(supabase, 4);

  return (
    <div className="flex flex-col gap-20 pb-16">
      
      {/* Hero Section Premium */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 overflow-hidden flex flex-col items-center text-center">
        {/* Latar Belakang Mesh Gradient Halus */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-[#020617] dark:to-[#020617]"></div>
        
        {/* Badge "Pembaruan" */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SparklesIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Koleksi Laptop Generasi Terbaru Telah Hadir</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
          Pusat Teknologi <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">
             Kinerja Tanpa Batas
          </span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          Tingkatkan produktivitas Anda. Temukan laptop impian dengan performa tak tertandingi dan desain elegan hanya di Core Teknologi.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link 
            href="/products" 
            className="group flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            Lihat Katalog
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="#produk" 
            className="flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            Pelajari Lebih Lanjut
          </Link>
        </div>
      </section>

      {/* Bagian Produk Unggulan */}
      <section id="produk" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Produk Unggulan</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Teknologi terlaris yang dipilih khusus untuk Anda</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group">
            Lihat semua <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => {
              const laptopData = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;
              const displayPrice = product.price || 0;

              return (
                <Link href={`/laptop/${product.id}`} key={product.id} className="group flex flex-col bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden">
                  
                  {/* Container Gambar dengan Rasio Estetik */}
                  <div className="relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-900/50 overflow-hidden p-4 flex items-center justify-center">
                    <Image
                      src={laptopData?.image_url || '/placeholder.png'}
                      alt={laptopData?.name || 'Produk'}
                      fill
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  
                  {/* Konten Card */}
                  <div className="p-5 flex flex-col flex-grow border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit mb-3">
                        {laptopData?.brand || 'Brand'}
                    </span>
                    
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug flex-grow group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {laptopData?.name || 'Produk Tanpa Nama'}
                    </h3>
                    
                    <div className="mt-4 flex items-end justify-between">
                        <p className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(displayPrice)}
                        </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 border-dashed">
             <p className="text-slate-500 font-medium">Belum ada produk unggulan untuk ditampilkan.</p>
          </div>
        )}
      </section>

    </div>
  );
}