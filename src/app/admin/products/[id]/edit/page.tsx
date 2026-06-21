// src/app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notFound, useParams } from "next/navigation";
import EditProductForm from "./EditProductForm";
import type { Product as BaseProduct } from "@/types";

// PERBAIKAN: Menambahkan ekstensi tipe agar selaras dengan yang dibutuhkan EditProductForm
type ExtendedProduct = BaseProduct & {
  price: number;
};

function EditProductSkeleton() {
    return (
        <div className="max-w-4xl mx-auto animate-pulse">
            <header className="mb-8">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </header>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 h-96"></div>
        </div>
    );
}

export default function EditProductPage() {
    const params = useParams<{ id: string }>();
    const productId = params.id;

    // PERBAIKAN: Menggunakan ExtendedProduct untuk State
    const [product, setProduct] = useState<ExtendedProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!productId) return;

        const supabase = createClient();
        const fetchProduct = async () => {
            // Relasi Paralel: JOIN laptops dan product_variants secara langsung
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    laptops ( * ),
                    product_variants ( * )
                `)
                .eq('id', productId)
                .single();

            if (error || !data) {
                setIsError(true);
            } else {
                // PERBAIKAN: Casting data dari database sebagai ExtendedProduct
                setProduct(data as unknown as ExtendedProduct);
            }
            setLoading(false);
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return <EditProductSkeleton />;
    }

    if (isError || !product) {
        return notFound();
    }

    const laptopData = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Edit Produk</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Anda sedang mengelola varian dan stok untuk: <span className="font-semibold">{laptopData?.name || 'Produk'}</span>
                </p>
            </header>
            <EditProductForm product={product} />
        </div>
    );
}