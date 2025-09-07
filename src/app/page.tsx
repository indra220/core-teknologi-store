// src/app/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import Image from 'next/image';
import { Laptop } from "@/types";

// --- OPTIMISASI PERFORMA TINGKAT LANJUT ---

// 1. Jalankan halaman ini di Edge Runtime untuk cold start super cepat.
export const runtime = 'edge';

// 2. Cache halaman ini di Edge selama 1 jam (3600 detik).
// Pengunjung akan mendapatkan versi instan dari cache.
// Next.js akan memperbarui cache di latar belakang setelah 1 jam.
export const revalidate = 3600;

// --- Sisa kode tidak berubah ---

export default async function HomePage() {
  const supabase = await createClient();
  const { data: laptops } = await supabase.from('laptops').select('*').order('created_at', { ascending: false });

  return (
    <section className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Produk Unggulan Kami</h1>
        <p className="mt-4 text-lg text-gray-600">Temukan teknologi terbaik untuk kebutuhan Anda.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {laptops?.map((laptop: Laptop) => (
          <div key={laptop.id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:-translate-y-2 duration-300 flex flex-col">
            <Link href={`/laptop/${laptop.id}`} className="block relative aspect-video">
              <Image
                src={laptop.image_url || '/placeholder.png'}
                alt={laptop.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </Link>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-gray-800 truncate flex-grow">
                <Link href={`/laptop/${laptop.id}`} className="hover:text-blue-600">{laptop.name}</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">{laptop.brand}</p>
              <p className="text-2xl font-bold text-blue-700 mt-4">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(laptop.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}