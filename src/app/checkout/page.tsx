// src/app/checkout/page.tsx
'use client';

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { CartItem } from "@/context/CartContext";
// 1. Impor komponen PayPalPayment
import PayPalPayment from "@/components/PayPalButtons";

export default function CheckoutPage() {
  const { cartItems, cartCount, updateQuantity, removeFromCart } = useCart();

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  if (cartCount === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800">Keranjang Anda Kosong</h1>
        <p className="mt-4 text-gray-600">Sepertinya Anda belum menambahkan produk apa pun.</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Detail Keranjang</h1>
        <p className="mt-2 text-lg text-gray-600">Periksa kembali pesanan Anda sebelum melanjutkan.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Kolom Kiri: Daftar Produk */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Produk Pesanan ({cartCount})</h2>
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item: CartItem) => (
              <li key={item.id} className="flex items-center py-6">
                <Image src={item.image_url || '/placeholder.png'} alt={item.name} width={96} height={96} className="h-24 w-24 rounded-lg object-cover border"/>
                <div className="ml-4 flex-grow">
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="mt-2 text-xs text-red-500 hover:text-red-700">Hapus</button>
                </div>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 font-bold text-gray-700 hover:bg-gray-100 rounded-l-lg">-</button>
                  <span className="px-4 text-sm font-semibold text-gray-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 font-bold text-gray-700 hover:bg-gray-100 rounded-r-lg">+</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Kolom Kanan: Ringkasan & Form Checkout */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ringkasan Pesanan</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim</span>
                <span>Gratis</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-4 mt-4">
                <span>Total</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
              </div>
            </div>
            {/* 2. Ganti <form> dengan komponen PayPalPayment */}
            <div className="mt-8">
              <PayPalPayment />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}