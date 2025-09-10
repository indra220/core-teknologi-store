'use client';

import { useCart, CartItem } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';

// Komponen Ikon
const EmptyCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();
  
  const subtotal = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          ></motion.div>
          
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Keranjang Belanja ({cartCount})</h2>
              <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-200 hover:text-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <CloseIcon />
              </button>
            </div>
            
            {cartItems.length > 0 ? (
              <>
                <div className="flex-grow p-6 overflow-y-auto">
                  <ul className="space-y-6">
                    <AnimatePresence>
                      {cartItems.map((item: CartItem) => (
                        <motion.li 
                          key={item.variantId} // PERBAIKAN: Gunakan variantId sebagai key unik
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center space-x-4"
                        >
                          {/* PERBAIKAN UTAMA: Ganti item.image_url menjadi item.imageUrl */}
                          <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} width={80} height={80} className="rounded-lg border border-gray-200 dark:border-gray-700 object-cover"/>
                          <div className="flex-grow">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}</p>
                          </div>
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                             {/* PERBAIKAN: Gunakan variantId untuk update kuantitas */}
                            <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">-</button>
                            <span className="px-3 text-sm font-semibold text-gray-900 dark:text-gray-50">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">+</button>
                          </div>
                          {/* PERBAIKAN: Gunakan variantId untuk menghapus item */}
                          <button onClick={() => removeFromCart(item.variantId)} title="Hapus item" className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
                <div className="p-6 border-t bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                    <span>Subtotal</span>
                    <span>{formattedSubtotal}</span>
                  </div>
                  <Link href="/checkout" onClick={onClose} className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md">
                    Lanjut ke Checkout
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <EmptyCartIcon />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-6">Keranjang Anda kosong</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ayo cari produk terbaik untukmu!</p>
                <Link href="/products" onClick={onClose} className="mt-8 bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-transform transform hover:scale-105 shadow-md">
                  Mulai Belanja
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}