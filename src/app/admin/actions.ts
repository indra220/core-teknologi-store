// src/app/admin/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Order } from "@/types";

// Definisikan tipe data spesifik untuk pesanan terbaru
type RecentOrder = Pick<Order, 'id' | 'created_at' | 'total_amount' | 'profiles'>;

// Definisikan tipe data untuk nilai kembalian fungsi
interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  recentOrders: RecentOrder[];
  newUsersCount: number;
  totalUsersCount: number;
  totalProducts: number;
}

/**
 * Mengambil statistik penting untuk ditampilkan di dashboard admin.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: todayOrdersData } = await supabase
    .from('orders')
    .select('total_amount')
    .gte('created_at', today.toISOString());

  // Kunci perbaikan ada di sini dengan `.returns<RecentOrder[]>()`
  const { data: recentOrdersData } = await supabase
    .from('orders')
    .select('id, created_at, total_amount, profiles ( username )')
    .order('created_at', { ascending: false })
    .limit(5)
    .returns<RecentOrder[]>(); // Ini memberitahu TypeScript bentuk data yang benar

  const { count: newUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  const { count: totalUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalProducts } = await supabase
    .from('laptops')
    .select('*', { count: 'exact', head: true });

  const todayRevenue = todayOrdersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  
  return {
    todayRevenue: todayRevenue,
    todayOrders: todayOrdersData?.length || 0,
    recentOrders: recentOrdersData || [],
    newUsersCount: newUsersCount || 0,
    totalUsersCount: totalUsersCount || 0,
    totalProducts: totalProducts || 0,
  };
}


/**
 * Menghapus produk beserta gambarnya dari storage.
 */
export async function deleteProduct(productId: string, imageUrl: string | null) {
  const supabase = await createClient();

  if (imageUrl) {
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('product-images').remove([fileName]);
    }
  }

  const { error } = await supabase.from('laptops').delete().eq('id', productId);

  if (error) {
    return { success: false, message: "Gagal menghapus produk." };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { success: true, message: "Produk berhasil dihapus." };
}