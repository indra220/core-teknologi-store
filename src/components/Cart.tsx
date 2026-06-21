// src/components/Cart.tsx
'use client';

import { useCart, CartItem } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';

// Ikon-ikon Modern
const EmptyCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>;

export default function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const { cartItems, removeFromCart, updateQuantity, cartCount } = useCart();
  
  const subtotal = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          
          {/* Panel Keranjang */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="relative h-full w-full max-w-md bg-white dark:bg-[#111827] shadow-2xl flex flex-col border-l border-slate-200/60 dark:border-slate-800"
          >
            {/* Header Keranjang */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Keranjang Belanja <span className="text-indigo-500 ml-1">({cartCount})</span></h2>
              <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon />
              </button>
            </div>
            
            {cartItems.length > 0 ? (
              <>
                {/* Daftar Item */}
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
                  <ul className="space-y-4">
                    <AnimatePresence>
                      {cartItems.map((item: CartItem) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const itemVariant = (item as any).variantName || (item as any).variant || (item as any).varian || (item as any).product_variant;
                          
                          return (
                            <motion.li 
                                key={item.variantId} 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-start gap-4 p-4 bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm group"
                            >
                                <div className="relative h-20 w-20 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1">
                                    <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} fill className="object-contain p-1" sizes="80px"/>
                                </div>
                                
                                <div className="flex-grow flex flex-col pt-0.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">{item.name}</p>
                                            {itemVariant && <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{itemVariant}</p>}
                                        </div>
                                        <button onClick={() => removeFromCart(item.variantId)} title="Hapus item" className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 -mt-1 -mr-1">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-end justify-between mt-4">
                                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                                            <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><MinusIcon /></button>
                                            <span className="px-2 w-8 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><PlusIcon /></button>
                                        </div>
                                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}</p>
                                    </div>
                                </div>
                            </motion.li>
                          )
                      })}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Footer Checkout */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formattedSubtotal}</span>
                  </div>
                  <Link href="/checkout" onClick={onClose} className="flex justify-center items-center w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 dark:shadow-indigo-900/20 gap-2">
                    Lanjut ke Pembayaran
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <EmptyCartIcon />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Keranjang Kosong</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[250px]">Anda belum menambahkan perangkat apa pun ke dalam keranjang.</p>
                <Link href="/products" onClick={onClose} className="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-md">
                  Jelajahi Produk
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}