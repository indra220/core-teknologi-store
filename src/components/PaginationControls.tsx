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
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-5">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Menampilkan <span className="font-bold">{startItem}</span> - <span className="font-bold">{endItem}</span> dari <span className="font-bold">{totalItems}</span> hasil
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Sebelumnya</span>
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <span>Berikutnya</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}