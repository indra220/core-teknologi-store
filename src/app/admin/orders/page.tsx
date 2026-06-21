// src/app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrderList from "./OrderList";

export const revalidate = 0;

// FUNGSI GENERATOR ID SERAGAM (Khusus Server)
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

export default async function ManageOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>; 
}) {
   const supabase = await createClient();
   
   // 1. Verifikasi Sesi & Role Admin
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) redirect('/login');
   
   const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
   if (profile?.role !== 'admin') redirect('/');

   // 2. Ekstrak parameter URL dengan `await`
   const resolvedSearchParams = await searchParams;
   const currentPage = Number(resolvedSearchParams?.page) || 1;
   const searchTerm = (resolvedSearchParams?.search || '').toLowerCase();
   const itemsPerPage = 10; 

   // 3. Tarik SEMUA data pesanan (Limit tinggi) agar kita bisa melakukan pencarian pintar di memori Javascript
   const { data: allOrders, error } = await supabase
       .from('orders')
       .select('*, profiles(username, full_name), order_items(*)')
       .order('created_at', { ascending: false })
       .limit(1000); // Tarik 1000 data terakhir (Sangat ringan untuk Next.js)

   if (error) {
       return (
           <div className="flex flex-col items-center justify-center py-20">
             <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
               <p className="font-semibold text-sm">Gagal memuat daftar pesanan.</p>
               <p className="text-xs mt-1 opacity-80">{error.message}</p>
             </div>
           </div>
       );
   }

   // 4. LAKUKAN FILTER PENCARIAN DI MEMORI (Tanpa Error Database)
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   let filteredOrders = (allOrders || []) as any[];

   if (searchTerm) {
       filteredOrders = filteredOrders.filter(order => {
           // Merakit ID Dinamis untuk dicocokkan
           const displayId = generateDisplayId(order).toLowerCase();
           const rawId = (order.id || '').toLowerCase();
           const paypalId = (order.paypal_order_id || '').toLowerCase();
           
           // Menangani potensi format array atau objek dari relasi profiles
           const profileObj = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
           const customerFullName = (profileObj?.full_name || '').toLowerCase();
           const customerUsername = (profileObj?.username || '').toLowerCase();

           return displayId.includes(searchTerm) || 
                  rawId.includes(searchTerm) || 
                  paypalId.includes(searchTerm) ||
                  customerFullName.includes(searchTerm) || 
                  customerUsername.includes(searchTerm);
       });
   }

   // 5. TERAPKAN PAGINASI MANUAL
   const totalOrders = filteredOrders.length;
   const totalPages = Math.ceil(totalOrders / itemsPerPage);
   const from = (currentPage - 1) * itemsPerPage;
   const to = from + itemsPerPage;
   const paginatedOrders = filteredOrders.slice(from, to);

   return (
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <header>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Kelola Pesanan</h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400">
             Pantau dan kelola semua transaksi dan status pengiriman pelanggan.
          </p>
        </header>

        <OrderList 
            orders={paginatedOrders} 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalOrders={totalOrders} 
            itemsPerPage={itemsPerPage} 
        />
     </div>
   );
}