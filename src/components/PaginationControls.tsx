// src/components/PaginationControls.tsx
'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', String(newPage));
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-6 gap-4">
      <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{startItem}</span> - <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> dari <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> hasil
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:active:scale-100 shadow-sm"
        >
          <ChevronLeftIcon className="h-4 w-4 stroke-2" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:active:scale-100 shadow-sm"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRightIcon className="h-4 w-4 stroke-2" />
        </button>
      </div>
    </div>
  );
}