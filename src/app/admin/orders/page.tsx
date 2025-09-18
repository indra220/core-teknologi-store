// src/app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Order, OrderStatus } from "@/types";
import OrderList from "./OrderList";
import { unstable_cache } from "next/cache";

const ITEMS_PER_PAGE = 10;

const getCachedAdminOrders = unstable_cache(
  async (supabase, currentPage: number, searchTerm: string) => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from('orders').select('*, profiles(username)', { count: 'exact' });
    
    if (searchTerm) {
      query = query.or(`paypal_order_id.ilike.%${searchTerm}%,profiles.username.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query.range(from, to);
    return { ordersData: data as Order[] | null, error, count };
  },
  ['admin-orders'],
  {
    tags: ['admin-orders'],
  }
);

export default async function ManageOrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = await createClient();
  const currentPage = Number(searchParams?.page) || 1;
  const searchTerm = searchParams?.search || '';

  const { ordersData, error, count } = await getCachedAdminOrders(supabase, currentPage, searchTerm);

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat data pesanan: {error.message}</div>;
  }

  const orders = ordersData || [];
  const statusPriority: Record<OrderStatus, number> = {
    'Menunggu Konfirmasi': 1, 'Diproses': 2, 'Dalam Pengiriman': 3, 'Selesai': 4, 'Dibatalkan': 5,
  };

  orders.sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Manajemen Pesanan</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Kelola pesanan yang masuk dan perbarui status pengiriman.</p>
      </header>
      <OrderList
        orders={orders}
        currentPage={currentPage}
        totalPages={totalPages}
        totalOrders={count || 0}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}