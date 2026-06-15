// src/app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrderList from "./OrderList";

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

   // 2. Ekstrak parameter URL dengan `await` (Wajib di Next.js 15)
   const resolvedSearchParams = await searchParams;
   const currentPage = Number(resolvedSearchParams?.page) || 1;
   const searchTerm = resolvedSearchParams?.search || '';
   const itemsPerPage = 10; 

   // 3. Bangun Query Supabase
   let query = supabase
       .from('orders')
       .select('*, profiles!inner(username)', { count: 'exact' })
       .order('created_at', { ascending: false });

   // Jika ada kata kunci pencarian, filter berdasarkan ID Pesanan (paypal_order_id)
   if (searchTerm) {
       query = query.ilike('paypal_order_id', `%${searchTerm}%`);
   }

   // 4. Terapkan Paginasi
   const from = (currentPage - 1) * itemsPerPage;
   const to = from + itemsPerPage - 1;
   query = query.range(from, to);

   // 5. Eksekusi Query
   const { data: ordersData, error, count } = await query;

   if (error) {
       return (
           <div className="p-8 text-center text-red-500 font-semibold">
               Terjadi kesalahan saat memuat daftar pesanan: {error.message}
           </div>
       );
   }

   const totalPages = Math.ceil((count || 0) / itemsPerPage);

   return (
     <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Kelola Pesanan</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
             Pantau dan kelola semua pesanan pelanggan dari satu tempat.
          </p>
        </header>

        <OrderList 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orders={(ordersData as any) || []} 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalOrders={count || 0} 
            itemsPerPage={itemsPerPage} 
        />
     </div>
   );
}