// src/app/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import Image from 'next/image';
import { Laptop } from "@/types";

export const runtime = 'edge';
export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: laptops } = await supabase.from('laptops').select('*').order('created_at', { ascending: false });

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
          <Link href="#produk" className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg">
            Lihat Produk
          </Link>
        </div>
      </div>

      <div id="produk" className="pt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50">Produk Unggulan Kami</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Teknologi terbaru yang kami pilih khusus untuk Anda.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {laptops?.map((laptop: Laptop) => (
            <div key={laptop.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-gray-950 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-gray-700 flex flex-col">
              <Link href={`/laptop/${laptop.id}`} className="block relative aspect-video overflow-hidden">
                <Image
                  src={laptop.image_url || '/placeholder.png'}
                  alt={laptop.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </Link>
              <div className="p-5 flex flex-col flex-grow">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{laptop.brand}</p>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate mt-1 flex-grow">
                  <Link href={`/laptop/${laptop.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{laptop.name}</Link>
                </h3>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-4">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(laptop.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}