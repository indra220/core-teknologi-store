// src/app/checkout/page.tsx
'use client';

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { CartItem } from "@/context/CartContext";
import PayPalPayment from "@/components/PayPalButtons";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { createOrderFromWallet } from "./actions";
import { useNotification } from "@/components/notifications/NotificationProvider";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useRouter } from "next/navigation"; // <-- IMPOR useRouter

// Ikon
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;
const ConfirmationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;


export default function CheckoutPage() {
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearClientCart } = useCart(); // <-- AMBIL clearClientCart
  const { showNotification } = useNotification();
  const router = useRouter(); // <-- DEFINISIKAN ROUTER
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        }
    };
    fetchProfile();
  }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const walletBalance = profile?.wallet_balance || 0;
  const isWalletSufficient = walletBalance >= subtotal;

  const handleWalletPaymentClick = () => {
    if (!isWalletSufficient) {
      showNotification("Saldo dompet tidak mencukupi.", "error");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    const result = await createOrderFromWallet(cartItems);
    
    // Alur baru setelah server action selesai
    if (result.success) {
      showNotification(result.message, 'success');
      clearClientCart(); // Bersihkan keranjang di state
      router.push('/orders?status=success'); // Arahkan pengguna
    } else {
      setIsProcessing(false);
      setIsModalOpen(false);
      showNotification(result.message, 'error');
    }
  };

  // ... (sisa kode komponen tidak berubah)
  if (cartCount === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Keranjang Anda Kosong</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Sepertinya Anda belum menambahkan produk apa pun.</p>
        <Link href="/products" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPayment}
        title="Konfirmasi Pembayaran"
        isProcessing={isProcessing}
        confirmText="Ya, Bayar Sekarang"
        icon={<ConfirmationIcon />}
      >
        <p>
          Anda akan membayar sebesar{" "}
          <span className="font-bold text-gray-800 dark:text-gray-100">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}
          </span>{" "}
          menggunakan saldo dompet Anda. Lanjutkan?
        </p>
      </ConfirmationModal>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Detail Keranjang</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Periksa kembali pesanan Anda sebelum melanjutkan.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Kolom Kiri: Daftar Produk */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Produk Pesanan ({cartCount})</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {cartItems.map((item: CartItem) => (
                <li key={item.variantId} className="flex items-center py-6">
                  <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} width={96} height={96} className="h-24 w-24 rounded-lg object-cover border dark:border-gray-700"/>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</p>
                    <button onClick={() => removeFromCart(item.variantId)} className="mt-2 text-xs text-red-500 hover:text-red-700">Hapus</button>
                  </div>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg">-</button>
                    <span className="px-4 text-sm font-semibold text-gray-900 dark:text-gray-50">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg">+</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Kolom Kanan: Ringkasan & Form Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Ringkasan Pesanan</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Ongkos Kirim</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-50 border-t dark:border-gray-600 pt-4 mt-4">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}</span>
                </div>
              </div>

              {profile && profile.role !== 'admin' && (
                  <div className="mt-8 border-t dark:border-gray-600 pt-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Metode Pembayaran</h3>
                      <div className="p-4 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-gray-800 dark:text-gray-100">Saldo Dompet</p>
                                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(walletBalance)}</p>
                              </div>
                              <button
                                  onClick={handleWalletPaymentClick}
                                  disabled={!isWalletSufficient || isProcessing}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                              >
                                  <WalletIcon/>
                                  <span>Bayar</span>
                              </button>
                          </div>
                          {!isWalletSufficient && (
                              <p className="text-xs text-red-500 mt-2">Saldo tidak mencukupi untuk transaksi ini.</p>
                          )}
                      </div>
                      <div className="flex items-center my-4">
                          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                          <span className="flex-shrink mx-4 text-gray-400 text-sm">ATAU</span>
                          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <PayPalPayment />
                  </div>
              )}
              
              {profile && profile.role === 'admin' && (
                  <div className="mt-8">
                      <p className="text-center text-sm mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">Admin tidak dapat menggunakan saldo dompet. Silakan gunakan metode pembayaran lain.</p>
                      <PayPalPayment />
                  </div>
              )}

              {!profile && (
                   <div className="mt-8">
                      <p className="text-center text-sm p-3">Memuat opsi pembayaran...</p>
                   </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}