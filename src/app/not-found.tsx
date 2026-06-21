// src/app/not-found.tsx
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[70vh] text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* Dekorasi Latar (Glow Effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      <h1 className="text-[150px] sm:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-400 dark:from-slate-100 dark:to-slate-800 leading-none tracking-tighter select-none">
        404
      </h1>
      
      <div className="mt-4 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Maaf, tautan yang Anda ikuti mungkin rusak, atau halaman telah dihapus.
        </p>
      </div>

      <Link 
        href="/" 
        className="mt-10 inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 group"
      >
        <ArrowLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}