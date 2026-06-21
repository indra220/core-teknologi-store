// src/app/admin/orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import { Order, Product, Laptops } from "@/types";
import Link from "@/components/NavigationLoader";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';
import UpdateStatusForm from "./UpdateStatusForm";
import { 
    UserIcon, 
    MapPinIcon, 
    ShoppingBagIcon,
    ArrowLeftIcon,
    InboxStackIcon,
    BanknotesIcon,
    ChevronDownIcon,
    CpuChipIcon,
    CircleStackIcon,
    ComputerDesktopIcon,
    CommandLineIcon // <-- PENAMBAHAN: Ikon untuk VGA
} from '@heroicons/react/24/outline';

type OrderPageParams = {
  id: string;
};

// =========================================================================
// FUNGSI DINAMIS GENERATOR ID SERAGAM
// =========================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateDisplayId = (order: any) => {
    if (!order) return 'INV-UNKNOWN';
    const date = new Date(order.created_at || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;
    
    const firstItem = order.order_items?.[0];
    const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalQty = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
    const uniqueTail = order.id ? order.id.split('-')[0].substring(0, 4).toUpperCase() : 'XXXX';
    
    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
};

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
  
  let name = '';
  if (nameMatch) {
     name = nameMatch[0].replace(/,\s*$/, '').trim(); 
  } else {
     name = text.split(',')[0].slice(0, 50).trim();
  }

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

interface DetailItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  variant_name?: string;
  variant?: string;
  product_variants?: {
    processor?: string;
    graphic?: string; // <-- Memastikan tipe mendukung graphic
    ram?: string;
    storage?: string;
    screen_size?: string;
  } | null;
}

const OrderItemAccordion = ({ item, imageUrl }: { item: DetailItem, imageUrl: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const varianNameSaved = item.variant_name || item.variant || '';
  const specs = item.product_variants || {};

  return (
    <li className="group bg-white dark:bg-[#111827]">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="h-20 w-20 shrink-0 relative rounded-xl border border-slate-200/70 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-sm flex items-center justify-center">
            <Image src={imageUrl} alt={item.product_name} fill sizes="80px" className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
              <div onClick={(e) => e.stopPropagation()} className="inline-block mb-1">
                  <Link href={`/admin/products/${item.product_id || ''}/edit`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 transition-colors">
                      {item.product_name}
                  </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.quantity}x</span> 
                  @ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                  {varianNameSaved && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20 ml-1">
                        {varianNameSaved}
                    </span>
                  )}
              </p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
          <p className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mr-2">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
          </p>
          <div className={`p-1.5 rounded-full transition-transform duration-300 ${isOpen ? 'bg-slate-200 dark:bg-slate-700 rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
             <ChevronDownIcon className="w-5 h-5 stroke-2" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 bg-white dark:bg-[#111827]">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Spesifikasi Inti Otomatis</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="flex items-start gap-3">
                          <CpuChipIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Prosesor</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractProcessor(specs.processor)}
                              </p>
                          </div>
                      </div>

                      {/* PERBAIKAN: Menampilkan informasi Kartu Grafis (VGA) */}
                      <div className="flex items-start gap-3">
                          <CommandLineIcon className="w-5 h-5 text-purple-500 shrink-0" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Kartu Grafis (VGA)</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractGraphic(specs.graphic)}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <CircleStackIcon className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Memori & Penyimpanan</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractRam(specs.ram)} • {extractStorage(specs.storage)}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <ComputerDesktopIcon className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Layar</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractScreen(specs.screen_size)}
                              </p>
                          </div>
                      </div>

                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

function OrderDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 mb-3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-80 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-48"></div>
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-40"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-96"></div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-32"></div>
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-40"></div>
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm h-40"></div>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
  const params = useParams<OrderPageParams>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;

    async function getOrderDetails() {
      setLoading(true);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *, 
          profiles (username, full_name, email), 
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error("Error fetching order:", orderError?.message || orderError);
        setLoading(false);
        return;
      }

      type OrderItemBase = { product_id: string; variant_id?: string; [key: string]: unknown };

      const productIds = Array.from(new Set(orderData.order_items.map((item: OrderItemBase) => item.product_id).filter(Boolean))) as string[];
      const variantIds = Array.from(new Set(orderData.order_items.map((item: OrderItemBase) => item.variant_id).filter(Boolean))) as string[];

      let laptopsMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: laptops } = await supabase.from('laptops').select('product_id, image_url').in('product_id', productIds);
        if (laptops) {
          laptopsMap = laptops.reduce((acc, laptop) => {
            if (laptop.product_id && laptop.image_url) acc[laptop.product_id] = laptop.image_url;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let variantsMap: Record<string, any> = {};
      if (variantIds.length > 0) {
        const { data: variants } = await supabase.from('product_variants').select('*').in('id', variantIds);
        if (variants) {
          variantsMap = variants.reduce((acc, v) => {
            acc[v.id] = v;
            return acc;
          }, {});
        }
      }

      const formattedOrder = {
        ...orderData,
        order_items: orderData.order_items.map((item: OrderItemBase) => ({
          ...item,
          products: { laptops: [{ image_url: laptopsMap[item.product_id] || null }] },
          product_variants: variantsMap[item.variant_id || ''] || null
        }))
      };

      setOrder(formattedOrder as unknown as Order);
      setLoading(false);
    }

    getOrderDetails();
  }, [orderId, supabase, refreshTrigger]);

  if (loading) return <OrderDetailSkeleton />;

  if (!order) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                <InboxStackIcon className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pesanan Tidak Ditemukan</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ID pesanan mungkin tidak sah atau telah dipadamkan.</p>
            <Link href="/admin/orders" className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Kembali ke Daftar Pesanan &rarr;
            </Link>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Rincian Pesanan
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(order as any).payment_method && (
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans border border-slate-200 dark:border-slate-700">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(order as any).payment_method}
                  </span>
                )}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                ID Transaksi: <span className="font-mono font-semibold text-slate-900 dark:text-white">#{generateDisplayId(order)}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                Direkam pada {formatDate(order.created_at)}
            </p>
        </div>
        <Link 
            href="/admin/orders" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 w-fit"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-slate-400" />
                        Item yang Dipesan
                    </h2>
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {order.order_items.length} Barang
                    </span>
                </div>
                
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {order.order_items.map((item: any) => {
                        const productsData = item.products as (Product & { laptops: Laptops | Laptops[] | null }) | null;
                        const laptopData = productsData?.laptops ? (Array.isArray(productsData.laptops) ? productsData.laptops[0] : productsData.laptops) : null;
                        const imageUrl = laptopData?.image_url || '/placeholder.png';

                        return <OrderItemAccordion key={item.id} item={item} imageUrl={imageUrl} />;
                    })}
                </ul>
                
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Keseluruhan</span>
                    <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                        <BanknotesIcon className="h-6 w-6 opacity-70" />
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6">
                <UpdateStatusForm key={order.status} order={order} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Informasi Pelanggan</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200/50 dark:border-slate-700 shadow-sm">
                            {(order.profiles?.full_name || order.profiles?.username || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{order.profiles?.full_name || 'Tanpa Nama'}</p>
                            <p className="text-xs text-slate-500">@{order.profiles?.username}</p>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{order.profiles?.email}</p>
                    </div>
                </div>
            </div>
            
             <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Destinasi Pengiriman</h2>
                </div>
                <div className="p-5">
                    {order.shipping_address ? (
                        <address className="text-sm text-slate-700 dark:text-slate-300 not-italic leading-relaxed">
                            <span className="block font-medium mb-1 text-slate-900 dark:text-white">{order.shipping_address.address_line_1}</span>
                            {order.shipping_address.admin_area_2}, {order.shipping_address.admin_area_1} <br/>
                            <span className="font-mono text-xs">{order.shipping_address.postal_code}</span> • {order.shipping_address.country_code}
                        </address>
                    ) : (
                        <div className="text-center py-4">
                            <MapPinIcon className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Alamat pengiriman tidak tersedia untuk pesanan ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}