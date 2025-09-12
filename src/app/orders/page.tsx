// src/app/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Order, OrderStatus } from "@/types";
import Link from "next/link";
import Image from "next/image";
import CancelOrderButton from "./CancelOrderButton";
import ConfirmDeliveryButton from "./ConfirmDeliveryButton";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getStatusBadgeColor = (status: OrderStatus) => {
  switch (status) {
    case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
    case 'Diproses': return 'bg-blue-100 text-blue-800';
    case 'Dalam Pengiriman': return 'bg-cyan-100 text-cyan-800';
    case 'Selesai': return 'bg-green-100 text-green-800';
    case 'Dibatalkan': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, order_items (*, products (name, image_url))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-center py-10 text-red-500">Gagal memuat riwayat pesanan.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Pesanan Saya</h1>
        <p className="mt-2 text-lg text-gray-600">Lihat riwayat semua transaksi Anda di sini.</p>
      </header>

      {orders && orders.length > 0 ? (
        <div className="space-y-8">
          {(orders as Order[]).map((order) => (
            <div key={order.id} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Pesanan #{order.paypal_order_id}</h2>
                  <p className="text-sm text-gray-500">Tanggal: {formatDate(order.created_at)}</p>
                </div>
                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                    <p className="font-semibold text-gray-900 text-lg">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}
                    </p>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                {order.order_items.map(item => (
                    <div key={item.id} className="flex items-center">
                        <Image src={item.products?.image_url || '/placeholder.png'} alt={item.product_name} width={64} height={64} className="h-16 w-16 rounded-lg object-cover border"/>
                        <div className="ml-4 flex-grow">
                            <p className="font-semibold text-gray-800">{item.product_name}</p>
                            <p className="text-sm text-gray-600">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                        </div>
                    </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-4">
                {order.shipping_address ? (
                  <div>
                      <h3 className="font-semibold text-gray-700">Alamat Pengiriman</h3>
                      <address className="text-sm text-gray-600 not-italic mt-1">
                          {order.shipping_address.address_line_1}<br/>
                          {order.shipping_address.admin_area_2}, {order.shipping_address.admin_area_1} {order.shipping_address.postal_code}<br/>
                          {order.shipping_address.country_code}
                      </address>
                  </div>
                ) : <div />}
                
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {order.status === 'Menunggu Konfirmasi' && (
                      <CancelOrderButton orderId={order.id} />
                    )}
                    {order.status === 'Dalam Pengiriman' && (
                      <ConfirmDeliveryButton orderId={order.id} />
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700">Belum Ada Pesanan</h2>
          <p className="mt-2 text-gray-500">Anda belum melakukan transaksi apa pun.</p>
          <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700">
            Mulai Belanja
          </Link>
        </div>
      )}
    </div>
  );
}