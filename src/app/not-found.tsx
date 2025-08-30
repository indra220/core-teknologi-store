import { Suspense } from 'react';
import NotFoundContent from '@/components/NotFoundContent';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
      <Suspense fallback={<div className="text-center text-lg">Memuat...</div>}>
        <NotFoundContent />
      </Suspense>
    </div>
  );
}