import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Komponen internal yang menjadi Client Component
function NotFoundContent() {
  'use client';
  // PERBAIKAN: Tambahkan underscore karena variabel tidak dipakai
  const _searchParams = useSearchParams();

  return (
    <div className="text-center">
      <h1 className="text-9xl font-extrabold text-gray-800 tracking-widest">404</h1>
      <div className="bg-blue-600 px-2 text-sm text-white rounded rotate-12 absolute">
        Page Not Found
      </div>
      <p className="mt-4 text-lg text-gray-600">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
      <Link href="/" className="mt-8 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition">
        Kembali ke Beranda
      </Link>
    </div>
  );
}


// Komponen utama yang diekspor
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
      <Suspense fallback={<div className="text-center text-lg">Memuat...</div>}>
        <NotFoundContent />
      </Suspense>
    </div>
  );
}