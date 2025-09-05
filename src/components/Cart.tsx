'use client';

import { useCart, CartItem } from "@/context/CartContext"; // Impor CartItem
import Link from "next/link";
import Image from "next/image";

export default function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();
  
  const subtotal = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      
      <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Keranjang Belanja ({cartCount})</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        {cartItems.length > 0 ? (
          <>
            <div className="flex-grow p-6 overflow-y-auto">
              <ul className="space-y-4">
                {cartItems.map((item: CartItem) => ( // Beri tipe pada item
                  <li key={item.id} className="flex items-center space-x-4">
                    <Image src={item.image_url || '/placeholder.png'} alt={item.name} width={64} height={64} className="rounded-md border"/>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                    </div>
                    <div className="flex items-center border rounded-md">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1">-</button>
                      <span className="px-3">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-xs">Hapus</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between font-bold text-lg text-gray-800">
                <span>Subtotal</span>
                <span>{formattedSubtotal}</span>
              </div>
              <Link href="/checkout" onClick={onClose} className="mt-4 block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Lanjut ke Checkout
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
            <h3 className="text-lg font-semibold text-gray-700">Keranjang Anda kosong</h3>
            <p className="text-sm text-gray-500 mt-2">Ayo cari produk terbaik untukmu!</p>
            <Link href="/" onClick={onClose} className="mt-6 bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900">
              Mulai Belanja
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}