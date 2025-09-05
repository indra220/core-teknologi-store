import { createClient } from "@/lib/supabase/server";
import { Laptop } from "@/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ClockIcon, CubeTransparentIcon, ComputerDesktopIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 3600;

const SpecItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-start py-3 border-b border-gray-700 last:border-b-0">
      <div className="mr-3 text-gray-400 flex-shrink-0">{icon}</div>
      <div>
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="text-base font-semibold text-white">{value}</dd>
      </div>
    </div>
  );
};

export default async function DetailLaptopPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: laptop } = await supabase
    .from('laptops')
    .select('*')
    .eq('id', params.id)
    .single<Laptop>();

  if (!laptop) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-300 bg-gray-800 border border-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Kembali
        </Link>
      </div>

      <div className="bg-gray-800 p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        <div className="flex flex-col items-center justify-center p-4 bg-gray-700 rounded-2xl shadow-inner border border-gray-600">
          <div className="relative w-full aspect-square max-w-lg">
            <Image
              src={laptop.image_url || '/placeholder.png'}
              alt={laptop.name}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-blue-400 font-semibold uppercase tracking-wider">{laptop.brand}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {laptop.name}
          </h1>
          
          <p className="mt-6 text-base text-gray-300 leading-relaxed max-w-prose">
            {laptop.description || 'Tidak ada deskripsi rinci untuk produk ini.'}
          </p>

          <div className="mt-8 border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-bold text-white mb-5">Detail Spesifikasi</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <SpecItem icon={<ClockIcon className="h-5 w-5" />} label="Prosesor" value={laptop.processor} />
              <SpecItem icon={<CubeTransparentIcon className="h-5 w-5" />} label="RAM" value={laptop.ram} />
              <SpecItem icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />} label="Penyimpanan" value={laptop.storage} />
              <SpecItem icon={<ComputerDesktopIcon className="h-5 w-5" />} label="Ukuran Layar" value={laptop.screen_size} />
            </dl>
          </div>
          
          {/* Kirim seluruh objek 'laptop' ke komponen klien */}
          <ProductDetailClient product={laptop} />
        </div>
      </div>
    </div>
  );
}