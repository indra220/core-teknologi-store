// src/app/admin/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Order } from "@/types";

// --- PERBAIKAN DI SINI ---
// Mendefinisikan tipe secara manual untuk menghindari error kompilasi ts(2314)
type RecentOrder = {
  id: Order['id'];
  created_at: Order['created_at'];
  total_amount: Order['total_amount'];
  profiles: Order['profiles'];
};

// Tipe baru untuk data tren penjualan
interface SalesTrendPoint {
  date: string;
  total: number;
}

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  recentOrders: RecentOrder[];
  newUsersCount: number;
  totalUsersCount: number;
  totalProducts: number;
  salesTrend: SalesTrendPoint[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: todayCompletedOrdersData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'Selesai') 
    .gte('created_at', today.toISOString());

  const { count: todayOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  const { data: recentOrdersData } = await supabase
    .from('orders')
    .select('id, created_at, total_amount, profiles ( username )')
    .order('created_at', { ascending: false })
    .limit(5)
    .returns<RecentOrder[]>();

  const { count: newUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  const { count: totalUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  const { data: salesData } = await supabase
    .from('orders')
    .select('created_at, total_amount')
    .eq('status', 'Selesai')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const salesByDay = new Map<string, number>();
  if (salesData) {
    salesData.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      salesByDay.set(date, (salesByDay.get(date) || 0) + order.total_amount);
    });
  }

  const sortedSalesTrend = Array.from(salesByDay.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayRevenue = todayCompletedOrdersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  
  return {
    todayRevenue: todayRevenue,
    todayOrders: todayOrdersCount || 0,
    recentOrders: recentOrdersData || [],
    newUsersCount: newUsersCount || 0,
    totalUsersCount: totalUsersCount || 0,
    totalProducts: totalProducts || 0,
    salesTrend: sortedSalesTrend,
  };
}

export async function deleteProduct(productId: string, imageUrl: string | null) {
  const supabase = await createClient();

  if (imageUrl) {
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('product-images').remove([fileName]);
    }
  }
  
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    return { success: false, message: "Gagal menghapus produk." };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { success: true, message: "Produk berhasil dihapus." };
}