// src/app/admin/orders/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Order } from "@/types";
import Link from "next/link";
import Image from "next/image";
import UpdateStatusForm from "./UpdateStatusForm";
import { UserIcon, MapPinIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  // --- KEMBALIKAN 'await' DI SINI ---
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      user_id,
      profiles (username, full_name, email),
      order_items (
        *,
        products (name, image_url)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !order) {
    notFound();
  }
  
  const typedOrder = order as unknown as Order;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Detail Pesanan</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                ID Pesanan: <span className="font-mono">{typedOrder.paypal_order_id}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tanggal: {formatDate(typedOrder.created_at)}
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
                    Item Pesanan ({typedOrder.order_items.length})
                </h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {typedOrder.order_items.map(item => (
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
                    Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(typedOrder.total_amount)}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <UpdateStatusForm order={typedOrder} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <UserIcon className="h-6 w-6" />
                    Pelanggan
                </h2>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-semibold">Nama:</span> {typedOrder.profiles?.full_name || 'N/A'}</p>
                    <p><span className="font-semibold">Username:</span> {typedOrder.profiles?.username}</p>
                    <p><span className="font-semibold">Email:</span> {typedOrder.profiles?.email}</p>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <MapPinIcon className="h-6 w-6" />
                    Alamat Pengiriman
                </h2>
                {typedOrder.shipping_address ? (
                    <address className="text-sm text-gray-700 dark:text-gray-300 not-italic">
                        {typedOrder.shipping_address.address_line_1}<br/>
                        {typedOrder.shipping_address.admin_area_2}, {typedOrder.shipping_address.admin_area_1} {typedOrder.shipping_address.postal_code}<br/>
                        {typedOrder.shipping_address.country_code}
                    </address>
                ) : <p className="text-sm text-gray-500">Alamat tidak tersedia.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}