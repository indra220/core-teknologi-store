// src/app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { notFound, useParams } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { PencilIcon, ArrowLeftIcon, TagIcon, CubeIcon } from '@heroicons/react/24/outline';
import type { Product as BaseProduct } from "@/types";

// Mengabaikan 'catagory' yang salah ketik di types.ts dan menambahkan tipe yang benar
type ExtendedProduct = Omit<BaseProduct, 'catagory'> & {
    category?: string;
    price?: number;
};

// Komponen Skeleton untuk Loading State
function ProductDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto animate-pulse py-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-2xl md:col-span-1"></div>
                <div className="md:col-span-2 space-y-4">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                </div>
            </div>
        </div>
    );
}

export default function AdminProductDetailPage() {
    const params = useParams<{ id: string }>();
    const productId = params.id;

    const [product, setProduct] = useState<ExtendedProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!productId) return;

        const supabase = createClient();
        const fetchProduct = async () => {
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
                setProduct(data as unknown as ExtendedProduct);
            }
            setLoading(false);
        };

        fetchProduct();
    }, [productId]);

    if (loading) return <ProductDetailSkeleton />;
    if (isError || !product) return notFound();

    const laptopData = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;
    const variants = product.product_variants || [];

    return (
        <div className="max-w-5xl mx-auto py-2">
            {/* Header & Navigasi */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Detail Produk</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">ID: {product.id}</p>
                    </div>
                </div>
                <Link 
                    href={`/admin/products/${product.id}/edit`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-sm"
                >
                    <PencilIcon className="w-5 h-5" />
                    Edit Produk
                </Link>
            </div>

            {/* Kartu Informasi Utama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Bagian Gambar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center h-fit">
                    {laptopData?.image_url ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <Image 
                                src={laptopData.image_url} 
                                alt={laptopData.name || 'Produk Image'} 
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />
                        </div>
                    ) : (
                        <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600">
                            <CubeIcon className="w-16 h-16 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Bagian Detail Teks */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="mb-3 flex items-center gap-3">
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider">
                            {product.category || 'Laptop'}
                        </span>
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{laptopData?.name || 'Tanpa Nama'}</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-6">{laptopData?.brand || 'Brand Tidak Diketahui'}</p>
                    
                    <div className="flex items-center gap-2 text-2xl font-extrabold text-green-600 dark:text-green-400 mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30 w-fit">
                        <TagIcon className="w-7 h-7" />
                        Rp {product.price?.toLocaleString('id-ID') || 0}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Deskripsi Produk</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            {laptopData?.description || 'Tidak ada deskripsi untuk produk ini.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabel Varian & Stok */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Varian & Stok</h3>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Total {variants.length} Varian
                    </span>
                </div>
                
                {variants.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                    <th className="py-4 font-semibold px-6">Prosesor</th>
                                    <th className="py-4 font-semibold px-6">RAM</th>
                                    <th className="py-4 font-semibold px-6">Storage</th>
                                    <th className="py-4 font-semibold px-6">Layar</th>
                                    <th className="py-4 font-semibold px-6 text-center">Stok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {variants.map((variant, index) => (
                                    <tr key={variant.id || index} className="transition-colors">
                                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{variant.processor || '-'}</td>
                                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{variant.ram || '-'}</td>
                                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{variant.storage || '-'}</td>
                                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{variant.screen_size || '-'}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${variant.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                                                {variant.stock} Unit
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        Produk ini belum memiliki varian yang terdaftar.
                    </div>
                )}
            </div>
        </div>
    );
}