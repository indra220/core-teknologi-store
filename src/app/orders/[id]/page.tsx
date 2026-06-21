// src/app/orders/[id]/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from "next/navigation";
import { Order, Product, Laptops } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';
import { cancelOrder, confirmOrderReceived } from "../actions"; 
import { useNotification } from '@/components/notifications/NotificationProvider';
import NProgress from 'nprogress';
import { 
    MapPinIcon, 
    ShoppingBagIcon,
    ArrowLeftIcon,
    InboxStackIcon,
    BanknotesIcon,
    ChevronDownIcon,
    CpuChipIcon,
    CircleStackIcon,
    ComputerDesktopIcon,
    CommandLineIcon,
    XCircleIcon,
    CheckBadgeIcon
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
  
  // PERBAIKAN: Menggunakan const untuk variabel name agar lolos dari aturan ESLint 'prefer-const'
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
    return [sizeMatch, typeMatch].filter(Boolean).join(' ') || text.slice(0, 20);
};

const extractStorage = (text?: string | null) => {
    if (!text) return '-';
    const sizeMatch = text.match(/\d+(?:\.\d+)?\s*(?:GB|TB)/i)?.[0] || '';
    let typeMatch = '';
    if (/SSD/i.test(text)) typeMatch = 'SSD';
    else if (/HDD/i.test(text)) typeMatch = 'HDD';
    else if (/NVMe/i.test(text)) typeMatch = 'NVMe';
    else if (/eMMC/i.test(text)) typeMatch = 'eMMC';
    return [sizeMatch, typeMatch].filter(Boolean).join(' ') || text.slice(0, 20);
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

const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: Record<string, string> = {
      'Menunggu Konfirmasi': 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      'Diproses': 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      'Dalam Pengiriman': 'bg-cyan-50 text-cyan-700 border-cyan-200/50 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
      'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      'Dibatalkan': 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${statusStyles[status] || statusStyles['Menunggu Konfirmasi']}`}>
        {status}
      </span>
    );
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
    graphic?: string; 
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
                  <Link href={`/laptop/${item.product_id || ''}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 transition-colors">
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
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Spesifikasi Detail Item</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="flex items-start gap-3">
                          <CpuChipIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Prosesor</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractProcessor(specs.processor)}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <CommandLineIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Kartu Grafis (VGA)</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractGraphic(specs.graphic)}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <CircleStackIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Memori & Penyimpanan</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                                  {extractRam(specs.ram)} • {extractStorage(specs.storage)}
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <ComputerDesktopIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
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
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-32 mb-8"></div>
            <div className="bg-white dark:bg-[#111827] rounded-3xl h-32 w-full"></div>
            <div className="bg-white dark:bg-[#111827] rounded-3xl h-64 w-full"></div>
            <div className="bg-white dark:bg-[#111827] rounded-3xl h-40 w-full"></div>
        </div>
    );
}

export default function UserOrderDetailPage() {
  const params = useParams<OrderPageParams>();
  const orderId = params.id;
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isPending, startTransition] = useTransition();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;

    async function getOrderDetails() {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          router.push('/login');
          return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *, 
          profiles (username, full_name, email), 
          order_items (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
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
  }, [orderId, supabase, refreshTrigger, router]);

  const handleCancelOrder = async () => {
      if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat dibatalkan.")) return;
      NProgress.start();
      
      startTransition(async () => {
          const result = await cancelOrder(orderId);
          if (result.success) {
              showNotification(result.message, 'success');
              setRefreshTrigger(prev => prev + 1);
          } else {
              showNotification(result.message, 'error');
          }
          NProgress.done();
      });
  };

  const handleConfirmReceived = async () => {
      if (!confirm("Pastikan pesanan Anda telah sampai dan sesuai. Konfirmasi penerimaan sekarang?")) return;
      NProgress.start();

      startTransition(async () => {
          const result = await confirmOrderReceived(orderId);
          if (result.success) {
              showNotification(result.message, 'success');
              setRefreshTrigger(prev => prev + 1);
          } else {
              showNotification(result.message, 'error');
          }
          NProgress.done();
      });
  };

  if (loading) return <OrderDetailSkeleton />;

  if (!order) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center max-w-7xl mx-auto px-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                <InboxStackIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pesanan Tidak Ditemukan</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">ID pesanan ini tidak dapat ditemukan di akun Anda. Mungkin Anda menggunakan akun yang berbeda saat memesan.</p>
            <Link href="/orders" className="mt-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
                Kembali ke Riwayat Pesanan
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 stroke-2" />
          Riwayat Pesanan
      </Link>

      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* HEADER PESANAN */}
          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                      <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                              #{generateDisplayId(order)}
                          </h1>
                          <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                          Dipesan pada {formatDate(order.created_at)}
                      </p>
                  </div>
                  <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Belanja</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}
                      </p>
                  </div>
              </div>
          </div>

          {/* ITEM PESANAN */}
          <div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5 text-slate-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Rincian Pembelian</h2>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {order.order_items.map((item: any) => {
                    const productsData = item.products as (Product & { laptops: Laptops | Laptops[] | null }) | null;
                    const laptopData = productsData?.laptops ? (Array.isArray(productsData.laptops) ? productsData.laptops[0] : productsData.laptops) : null;
                    const imageUrl = laptopData?.image_url || '/placeholder.png';
                    return <OrderItemAccordion key={item.id} item={item} imageUrl={imageUrl} />;
                })}
            </ul>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* INFO PENGIRIMAN */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                  <MapPinIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Alamat Pengiriman</h2>
              </div>
              {order.shipping_address ? (
                  <address className="text-sm text-slate-700 dark:text-slate-300 not-italic leading-relaxed">
                      <span className="block font-bold mb-1 text-slate-900 dark:text-white text-base">{order.profiles?.full_name || order.profiles?.username}</span>
                      {order.shipping_address.address_line_1} <br/>
                      {order.shipping_address.admin_area_2}, {order.shipping_address.admin_area_1} <br/>
                      <span className="font-mono text-xs">{order.shipping_address.postal_code}</span> • {order.shipping_address.country_code}
                  </address>
              ) : (
                  <p className="text-sm text-slate-500 italic">Data alamat tidak tersedia.</p>
              )}
          </div>

          {/* INFO PEMBAYARAN */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                  <BanknotesIcon className="h-5 w-5 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Metode Pembayaran</h2>
              </div>
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                     <BanknotesIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{order.payment_method}</p>
                      <p className="text-xs text-slate-500">{order.payment_method === 'paypal' ? 'Sudah Lunas' : 'Saldo dipotong otomatis'}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* PANEL AKSI USER */}
      {(order.status === 'Menunggu Konfirmasi' || order.status === 'Dalam Pengiriman') && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${order.status === 'Menunggu Konfirmasi' ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10'}`}>
            <h2 className={`text-lg font-bold mb-2 ${order.status === 'Menunggu Konfirmasi' ? 'text-rose-900 dark:text-rose-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                {order.status === 'Menunggu Konfirmasi' ? 'Ingin Membatalkan Pesanan?' : 'Pesanan Sudah Sampai?'}
            </h2>
            <p className={`text-sm mb-6 ${order.status === 'Menunggu Konfirmasi' ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {order.status === 'Menunggu Konfirmasi' 
                    ? 'Anda masih bisa membatalkan pesanan ini secara otomatis sebelum Admin memprosesnya. Dana akan langsung dikembalikan ke Dompet (Wallet) Anda.' 
                    : 'Jika barang sudah Anda terima dan kondisinya sesuai, silakan konfirmasi untuk menyelesaikan transaksi ini.'}
            </p>
            
            {order.status === 'Menunggu Konfirmasi' && (
                <button 
                    onClick={handleCancelOrder} 
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-rose-200 hover:border-rose-300 text-rose-600 dark:bg-slate-800 dark:border-rose-500/30 dark:text-rose-400 dark:hover:border-rose-500/50 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <XCircleIcon className="w-5 h-5 stroke-2" />
                    {isPending ? 'Memproses...' : 'Batalkan Pesanan Ini'}
                </button>
            )}

            {order.status === 'Dalam Pengiriman' && (
                <button 
                    onClick={handleConfirmReceived} 
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                    <CheckBadgeIcon className="w-5 h-5 stroke-2" />
                    {isPending ? 'Memproses...' : 'Ya, Barang Sudah Diterima'}
                </button>
            )}
        </div>
      )}

    </div>
  );
}