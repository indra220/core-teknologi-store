// src/app/laptop/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/types';
import { 
    ShoppingCartIcon, 
    CpuChipIcon, 
    CircleStackIcon, 
    ComputerDesktopIcon,
    CommandLineIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

// =========================================================================
// FUNGSI EKSTRAKTOR CERDAS (REGEX) UNTUK INFO SPESIFIKASI INTI
// =========================================================================
const extractProcessor = (text?: string | null) => {
    if (!text) return '-';
    const ghzMatches = text.match(/\d+(?:\.\d+)?\s*GHz/gi);
    let ghzText = '';
    if (ghzMatches && ghzMatches.length > 1) {
       ghzText = `${ghzMatches[0]} ~ ${ghzMatches[ghzMatches.length - 1]}`;
    } else if (ghzMatches && ghzMatches.length === 1) {
       ghzText = ghzMatches[0];
    }
  
    const coresMatch = text.match(/\d+\s*cores?/i)?.[0] || '';
    const coresFormatted = coresMatch ? `(${coresMatch})` : '';
  
    const nameRegex = /(?:Intel|AMD|Apple|Snapdragon|MediaTek)[\w\s®™-]+?(?=\s+\d+(?:\.\d+)?\s*GHz|\s*\d+\s*cores?|\s*\()/i;
    const nameMatch = text.match(nameRegex);
    
    const name = nameMatch ? nameMatch[0].replace(/,\s*$/, '').trim() : text.split(',')[0].slice(0, 50).trim();
  
    if (!ghzText && !coresMatch && !nameMatch) return text.slice(0, 60);
    return `${name} ${ghzText} ${coresFormatted}`.replace(/\s+/g, ' ').trim();
};

const extractScreen = (text?: string | null) => {
    if (!text) return '-';
    const size = text.match(/\d+(?:\.\d+)?\s*(?:"|'|”|″|-inch|inch|in\b)/i)?.[0] || '';
    const resName = text.match(/\b(?:HD|FHD|FHD\+|WUXGA|WQXGA|UHD|QHD|QHD\+|2K|3K|4K|5K|8K|1080p|1440p)\b/i)?.[0] || '';
    const resPixels = text.match(/\d{3,4}\s*[xX*]\s*\d{3,4}/)?.[0] || '';
    const res = [resName, resPixels ? `(${resPixels})` : ''].filter(Boolean).join(' ').trim();
    const panel = text.match(/\b(?:OLED|IPS|LCD|TN|AMOLED|Mini-LED|MiniLED|Retina)\b/i)?.[0] || '';
    const hzMatch = text.match(/\d+\s*Hz/i)?.[0] || '';
    
    const parts = [size, res, panel].filter(Boolean).join(' ');
    const hzPart = hzMatch ? `Refresh Rate: ${hzMatch}` : '';
    
    if (!parts && !hzPart) return text.slice(0, 50); 
    return `${parts}${parts && hzPart ? ' - ' : ''}${hzPart}`.trim(); 
};

const extractRam = (text?: string | null) => {
    if (!text) return '-';
    const sizeMatch = text.match(/\d+(?:\.\d+)?\s*(?:GB|TB)/i)?.[0] || '';
    const typeMatch = text.match(/\b(?:DDR\d|LPDDR\d[xX]?|Unified Memory)\b/i)?.[0] || '';
    const parts = [sizeMatch, typeMatch].filter(Boolean).join(' ');
    return parts || text.slice(0, 20);
};

const extractStorage = (text?: string | null) => {
    if (!text) return '-';
    const sizeMatch = text.match(/\d+(?:\.\d+)?\s*(?:GB|TB)/i)?.[0] || '';
    let typeMatch = '';
    if (/SSD/i.test(text)) typeMatch = 'SSD';
    else if (/HDD/i.test(text)) typeMatch = 'HDD';
    else if (/NVMe/i.test(text)) typeMatch = 'NVMe';
    else if (/eMMC/i.test(text)) typeMatch = 'eMMC';
    
    const parts = [sizeMatch, typeMatch].filter(Boolean).join(' ');
    return parts || text.slice(0, 20);
};

const extractGraphic = (text?: string | null) => {
    if (!text) return '-';
    return text.slice(0, 45).trim();
};

export default function LaptopDetailPage() {
    const { id } = useParams<{ id: string }>();
    const supabase = createClient();
    const { addToCart } = useCart();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedStorage, setSelectedStorage] = useState<string>('');
    const [selectedRam, setSelectedRam] = useState<string>('');
    const [activeImage, setActiveImage] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    laptops (*),
                    product_variants (*)
                `)
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error("Gagal memuat produk:", error);
                setLoading(false);
                return;
            }

            setProduct(data);
            const laptopData = Array.isArray(data.laptops) ? data.laptops[0] : data.laptops;
            setActiveImage(laptopData?.image_url || '/placeholder.png');
            
            if (data.product_variants && data.product_variants.length > 0) {
                setSelectedStorage(data.product_variants[0].storage || '512GB');
                setSelectedRam(data.product_variants[0].ram || '8GB');
            } else {
                setSelectedStorage('512GB');
                setSelectedRam('8GB');
            }
            
            setLoading(false);
        }
        fetchProduct();
    }, [id, supabase]);

    // =========================================================================
    // LOGIKA VARIAN PINTAR (SMART VARIANT LOGIC)
    // =========================================================================
    
    const variants = useMemo(() => product?.product_variants || [], [product?.product_variants]);
    const baseLaptop = useMemo(() => Array.isArray(product?.laptops) ? product?.laptops[0] : product?.laptops, [product?.laptops]);

    const availableStorages = useMemo(() => {
        if (variants.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.from(new Set(variants.map((v: any) => v.storage).filter(Boolean))) as string[];
        }
        return ['256GB', '512GB', '1TB', '1TB SSD']; 
    }, [variants]);

    const availableRams = useMemo(() => {
        if (variants.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.from(new Set(variants.map((v: any) => v.ram).filter(Boolean))) as string[];
        }
        return ['8GB', '16GB', '32GB'];
    }, [variants]);

    const currentVariant = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return variants.find((v: any) => v.storage === selectedStorage && v.ram === selectedRam) 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            || variants.find((v: any) => v.storage === selectedStorage) 
            || variants[0];
    }, [variants, selectedStorage, selectedRam]);

    const currentPrice = currentVariant?.price || baseLaptop?.price || product?.price || 0;
    const currentStock = currentVariant?.stock ?? 10; 

    // =========================================================================
    // FUNGSI AKSI (HANYA KERANJANG)
    // =========================================================================
    const handleAddToCart = async () => {
        if (!product || !currentVariant) return;
        setIsAdding(true);
        
        try {
            // PERBAIKAN FATAL: Memanggil addToCart persis sesuai definisi dari CartContext
            // Arg 1: product_utuh (bawaan dari DB)
            // Arg 2: variant_utuh (bawaan dari DB)
            // Arg 3: kuantitas (angka 1)
            await addToCart(product as Product, currentVariant as unknown as ProductVariant, 1);
        } catch (error) {
            console.error("Gagal memasukkan ke keranjang:", error);
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-pulse flex flex-col lg:flex-row gap-12">
                <div className="lg:w-1/2 bg-slate-200 dark:bg-slate-800 rounded-3xl h-[500px]"></div>
                <div className="lg:w-1/2 space-y-6">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3"></div>
                    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mt-8"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto py-32 px-4 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Produk tidak ditemukan</h2>
                <Link href="/products" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">Kembali ke Katalog</Link>
            </div>
        );
    }

    const displayName = baseLaptop?.name || product.name;
    const displayBrand = baseLaptop?.brand || 'Core Teknologi';
    const displayDesc = baseLaptop?.description || product.description;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8">
                <ArrowLeftIcon className="w-4 h-4 stroke-2" />
                Kembali ke Katalog
            </Link>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                
                {/* BAGIAN KIRI: FOTO PRODUK */}
                <div className="lg:w-1/2">
                    <div className="sticky top-28">
                        <div className="relative aspect-square w-full bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center p-8 group">
                            <Image 
                                src={activeImage} 
                                alt={displayName} 
                                fill 
                                className="object-contain p-8 group-hover:scale-105 transition-transform duration-500" 
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                            {currentStock <= 0 && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                                    <span className="px-6 py-3 bg-white text-rose-600 font-extrabold text-lg rounded-xl shadow-xl transform -rotate-12">
                                        STOK HABIS
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BAGIAN KANAN: DETAIL & VARIAN */}
                <div className="lg:w-1/2 flex flex-col">
                    
                    {/* 1. NAMA PRODUK */}
                    <div className="mb-6">
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                            {displayBrand}
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                            {displayName}
                        </h1>
                    </div>

                    {/* 2. DESKRIPSI PRODUK */}
                    <div className="mb-8">
                        <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-400 max-w-none leading-relaxed">
                            {displayDesc ? (
                                displayDesc.split('\n').map((line: string, i: number) => (
                                    <p key={i} className="mb-2">{line}</p>
                                ))
                            ) : (
                                <p className="italic opacity-70">Tidak ada deskripsi tersedia untuk produk ini.</p>
                            )}
                        </div>
                    </div>

                    {/* 3. SPESIFIKASI INTI */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 mb-8">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-5">Spesifikasi Inti</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                            
                            <div className="flex items-start gap-3">
                                <CpuChipIcon className="w-5 h-5 text-indigo-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Prosesor</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                        {extractProcessor(currentVariant?.processor || baseLaptop?.processor)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CommandLineIcon className="w-5 h-5 text-purple-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kartu Grafis</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                        {extractGraphic(currentVariant?.graphic || baseLaptop?.graphic)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <CircleStackIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Memori & Penyimpanan</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                        {extractRam(currentVariant?.ram || baseLaptop?.ram)} • {extractStorage(currentVariant?.storage || baseLaptop?.storage)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <ComputerDesktopIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Layar</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                        {extractScreen(currentVariant?.screen_size || baseLaptop?.screen_size)}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800 mb-8" />

                    {/* 4. VARIAN PENYIMPANAN (STORAGE) */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Kapasitas Penyimpanan</h3>
                            <span className="text-[11px] font-bold text-slate-400">Pilih Storage</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {availableStorages.map((storage) => {
                                const isSelected = selectedStorage === storage;
                                return (
                                    <button
                                        key={storage}
                                        onClick={() => setSelectedStorage(storage)}
                                        className={`relative flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                                            isSelected 
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500 shadow-sm' 
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <CircleStackIcon className={`h-6 w-6 mb-1.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                        <span className="text-sm font-extrabold">{extractStorage(storage)}</span>
                                        
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. VARIAN RAM */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Memori (RAM)</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {availableRams.map((ram) => {
                                const isSelected = selectedRam === ram;
                                return (
                                    <button
                                        key={ram}
                                        onClick={() => setSelectedRam(ram)}
                                        className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                                            isSelected 
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500 shadow-sm' 
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        {extractRam(ram)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ===================================================== */}
                    {/* TRANSAKSI BOX: HARGA & TOMBOL */}
                    {/* ===================================================== */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                        
                        {/* 5. HARGA & STOK */}
                        <div className="mb-6">
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentPrice)}
                                </p>
                                {currentVariant?.price && currentVariant.price > (baseLaptop?.price || 0) && (
                                    <span className="text-sm font-bold text-slate-400 line-through mb-1.5">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(baseLaptop?.price || 0)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                    <CheckBadgeIcon className="w-4 h-4" /> Tersedia {currentStock} Unit
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <ShieldCheckIcon className="w-4 h-4" /> Garansi Resmi 1 Tahun
                                </span>
                            </div>
                        </div>

                        {/* 6. TOMBOL AKSI HANYA KERANJANG */}
                        <div className="flex flex-col items-center gap-4">
                            <button 
                                onClick={handleAddToCart} 
                                disabled={isAdding || currentStock <= 0}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-extrabold text-base shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCartIcon className="w-6 h-6 stroke-2" /> 
                                {isAdding ? 'Menambahkan...' : 'Masukkan Keranjang'}
                            </button>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}