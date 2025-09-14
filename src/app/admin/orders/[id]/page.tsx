// src/app/admin/orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import { Order } from "@/types";
import Link from "@/components/NavigationLoader";
import Image from "next/image";
import UpdateStatusForm from "./UpdateStatusForm";
import { UserIcon, MapPinIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

// Tipe untuk params, tetap berguna untuk kejelasan
type OrderPageParams = {
  id: string;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

function OrderDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-80 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                </div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg w-40"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 h-96"></div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 h-24"></div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 h-40"></div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700 h-40"></div>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
  // 1. Dapatkan params secara langsung. useParams di Client Component mengembalikan objek.
  const params = useParams<OrderPageParams>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;

    async function getOrderDetails() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`*, user_id, profiles (username, full_name, email), order_items (*, products (name, image_url))`)
        .eq('id', orderId)
        .single();

      if (error || !data) {
        console.error("Error fetching order:", error);
        // notFound() tidak bisa digunakan di client, jadi kita bisa redirect atau tampilkan pesan
        // Untuk sekarang, kita tampilkan pesan error di console.
      } else {
        setOrder(data as unknown as Order);
      }
      setLoading(false);
    }

    getOrderDetails();
  }, [orderId, supabase]);

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return <div className="text-center p-12">Pesanan tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Detail Pesanan</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                ID Pesanan: <span className="font-mono">{order.paypal_order_id}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tanggal: {formatDate(order.created_at)}
            </p>
        </div>
        <Link href="/admin/orders" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
          &larr; Kembali ke Daftar
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <ShoppingBagIcon className="h-6 w-6"/>
                    Item Pesanan ({order.order_items.length})
                </h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {order.order_items.map(item => (
                        <li key={item.id} className="flex py-4">
                            <Image src={item.products?.image_url || '/placeholder.png'} alt={item.product_name} width={80} height={80} className="h-20 w-20 rounded-lg object-cover border dark:border-gray-600"/>
                            <div className="ml-4 flex-grow">
                                <p className="font-semibold text-gray-900 dark:text-gray-50">{item.product_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price * item.quantity)}
                            </p>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end text-xl font-extrabold text-gray-900 dark:text-gray-50 border-t dark:border-gray-600 mt-4 pt-4">
                    Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <UpdateStatusForm order={order} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <UserIcon className="h-6 w-6" />
                    Pelanggan
                </h2>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-semibold">Nama:</span> {order.profiles?.full_name || 'N/A'}</p>
                    <p><span className="font-semibold">Username:</span> {order.profiles?.username}</p>
                    <p><span className="font-semibold">Email:</span> {order.profiles?.email}</p>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <MapPinIcon className="h-6 w-6" />
                    Alamat Pengiriman
                </h2>
                {order.shipping_address ? (
                    <address className="text-sm text-gray-700 dark:text-gray-300 not-italic">
                        {order.shipping_address.address_line_1}<br/>
                        {order.shipping_address.admin_area_2}, {order.shipping_address.admin_area_1} {order.shipping_address.postal_code}<br/>
                        {order.shipping_address.country_code}
                    </address>
                ) : <p className="text-sm text-gray-500">Alamat tidak tersedia.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}