// src/app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notFound, useParams } from "next/navigation";
import EditProductForm from "./EditProductForm";
import type { Product } from "@/types";

// Skeleton component for loading state
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

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;

        const supabase = createClient();
        const fetchProduct = async () => {
            const { data } = await supabase
                .from('products')
                .select(`
                    *,
                    product_variants ( * )
                `)
                .eq('id', productId)
                .single<Product>();

            if (data) {
                setProduct(data);
            } else {
                notFound();
            }
            setLoading(false);
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return <EditProductSkeleton />;
    }

    if (!product) {
        return notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Edit Produk</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                    Anda sedang mengelola varian dan stok untuk: <span className="font-semibold">{product.name}</span>
                </p>
            </header>
            <EditProductForm product={product} />
        </div>
    );
}