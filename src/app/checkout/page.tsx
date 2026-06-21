// src/app/checkout/page.tsx
'use client';

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "@/components/NavigationLoader"; 
import { CartItem } from "@/context/CartContext";
import PayPalPayment from "@/components/PayPalButtons";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { useNotification } from "@/components/notifications/NotificationProvider";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useRouter } from "next/navigation";
import NProgress from 'nprogress'; 

import { 
  MapPinIcon, 
  PencilSquareIcon, 
  WalletIcon, 
  CheckCircleIcon,
  ShoppingBagIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function CheckoutPage() {
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearClientCart } = useCart();
  const { showNotification } = useNotification();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Form Alamat
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const isAddressValid = addressLine1.trim() !== "" && city.trim() !== "" && province.trim() !== "" && postalCode.trim() !== "";

  const loadAddressFromProfile = (profileData: Profile) => {
      if (profileData?.address_detail) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let addr: any = profileData.address_detail;
          if (typeof addr === 'string') {
              try {
                  addr = JSON.parse(addr);
              } catch (_e) { 
                  addr = { address_line_1: addr };
              }
          }
          setAddressLine1(addr.address_line_1 || addr.address || addr.alamat_lengkap || (typeof profileData.address_detail === 'string' ? profileData.address_detail : ""));
          setCity(addr.city || addr.admin_area_2 || addr.kota || "");
          setProvince(addr.province || addr.admin_area_1 || addr.provinsi || "");
          setPostalCode(addr.postal_code || addr.kode_pos || "");
          return true;
      }
      return false;
  };

  useEffect(() => {
    const supabase = createClient();
    const fetchProfileAndAddress = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            if (loadAddressFromProfile(profileData)) {
               setIsEditingAddress(false); 
               return; 
            }

            const { data: lastOrder } = await supabase
              .from('orders')
              .select('shipping_address')
              .eq('user_id', user.id)
              .not('shipping_address', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastOrder?.shipping_address) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const addr = lastOrder.shipping_address as any;
               setAddressLine1(addr.address_line_1 || "");
               setCity(addr.admin_area_2 || "");
               setProvince(addr.admin_area_1 || "");
               setPostalCode(addr.postal_code || "");
               setIsEditingAddress(false); 
            } else {
               setIsEditingAddress(true);
            }
        }
    };
    fetchProfileAndAddress();
  }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const walletBalance = profile?.wallet_balance || 0;
  const isWalletSufficient = walletBalance >= subtotal;

  const handleSaveAddress = async () => {
      if (!isAddressValid) {
          showNotification("Harap lengkapi semua kolom alamat pengiriman.", "error");
          return;
      }

      setIsSavingAddress(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
          const addressJson = {
              address_line_1: addressLine1,
              city: city,
              province: province,
              postal_code: postalCode
          };

          const { error } = await supabase
              .from('profiles')
              .update({ address_detail: addressJson })
              .eq('id', user.id);

          if (error) {
              showNotification("Gagal menyimpan alamat ke profil.", "error");
          } else {
              showNotification("Alamat berhasil disimpan ke profil Anda.", "success");
              setProfile(prev => prev ? { ...prev, address_detail: JSON.stringify(addressJson) } : null);
              setIsEditingAddress(false);
          }
      }
      setIsSavingAddress(false);
  };

  const handleCancelAddress = () => {
      if (profile) {
          loadAddressFromProfile(profile);
      }
      setIsEditingAddress(false);
  };

  const currentShippingAddress = {
      address_line_1: addressLine1,
      admin_area_2: city, 
      admin_area_1: province, 
      postal_code: postalCode,
      country_code: "ID" 
  };

  const handleWalletPaymentClick = () => {
    if (!isAddressValid || isEditingAddress) {
        showNotification("Harap lengkapi dan simpan alamat pengiriman Anda terlebih dahulu!", "error");
        return;
    }
    if (!isWalletSufficient) {
        showNotification("Saldo dompet tidak mencukupi.", "error");
        return;
    }
    setIsModalOpen(true);
  };

  // PERBAIKAN: Menghubungkan Wallet dengan API /orders secara seragam
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    NProgress.start(); 

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cartItems,
          localShippingAddress: currentShippingAddress,
          paymentMethod: 'wallet' // <-- Kunci pembeda untuk diproses sebagai Wallet
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        clearClientCart();
        router.push('/orders?message=order_success');
      } else {
        throw new Error(result.error || "Gagal memproses pesanan.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setIsProcessing(false);
      setIsModalOpen(false);
      showNotification(error.message, 'error');
      NProgress.done(); 
    }
  };

  if (cartCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <ShoppingBagIcon className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Keranjang Anda Kosong</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-sm">Sepertinya Anda belum menemukan produk yang tepat. Mari jelajahi koleksi kami.</p>
        <Link 
            href="/products" 
            className="mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-md active:scale-95"
        >
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
        icon={<CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
      >
        <p className="text-slate-600 dark:text-slate-300">
          Anda akan membayar sebesar{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}
          </span>{" "}
          menggunakan saldo dompet Anda. Lanjutkan proses?
        </p>
      </ConfirmationModal>

      <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Penyelesaian Pesanan</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Verifikasi alamat pengiriman dan produk Anda sebelum melakukan pembayaran.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Kartu Alamat Pengiriman */}
            <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 transition-all">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPinIcon className="h-6 w-6 text-indigo-500" />
                    Destinasi Pengiriman
                  </h2>
                  
                  {!isEditingAddress && (
                     <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl active:scale-95"
                     >
                        <PencilSquareIcon className="h-4 w-4" />
                        Ubah Alamat
                     </button>
                  )}
              </div>

              {isEditingAddress ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in zoom-in-95 duration-300">
                     <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Alamat Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <textarea 
                          required 
                          rows={3} 
                          value={addressLine1} 
                          onChange={e => setAddressLine1(e.target.value)} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400 resize-none" 
                          placeholder="Cth: Jl. Merdeka No. 123, RT 01/RW 02, Kec. Tawang"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Kota / Kabupaten <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={city} 
                          onChange={e => setCity(e.target.value)} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400" 
                          placeholder="Cth: Tasikmalaya" 
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Provinsi <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={province} 
                          onChange={e => setProvince(e.target.value)} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400" 
                          placeholder="Cth: Jawa Barat" 
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Kode Pos <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={postalCode} 
                          onChange={e => setPostalCode(e.target.value)} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400" 
                          placeholder="Cth: 46115" 
                        />
                     </div>
                     <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                         <button 
                            type="button"
                            onClick={handleCancelAddress}
                            disabled={isSavingAddress}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                         >
                            Batal
                         </button>
                         <button 
                            onClick={handleSaveAddress}
                            disabled={isSavingAddress}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                         >
                            {isSavingAddress ? (
                              <><span className="animate-pulse">Menyimpan...</span></>
                            ) : 'Simpan Alamat'}
                         </button>
                     </div>
                  </div>
              ) : (
                  <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                          {profile?.full_name || profile?.username || 'Pelanggan'}
                          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-md">Utama</span>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {addressLine1}<br/>
                          {city}, {province} <span className="font-mono text-xs">{postalCode}</span><br/>
                          Indonesia
                      </p>
                  </div>
              )}
            </div>

            {/* Kartu Daftar Produk */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBagIcon className="h-6 w-6 text-indigo-500" />
                  Rincian Item ({cartCount})
                </h2>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 sm:p-4">
                {cartItems.map((item: CartItem) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const itemVariant = (item as any).variantName || (item as any).variant || (item as any).varian || (item as any).product_variant;
                  
                  return (
                    <li key={item.variantId} className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl transition-colors gap-4">
                      <div className="h-20 w-20 shrink-0 relative rounded-xl border border-slate-200/70 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-sm">
                          <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} fill sizes="80px" className="object-cover"/>
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2">{item.name}</h3>
                        {itemVariant && (
                            <p className="text-xs text-slate-500 mt-1">Varian: <span className="font-medium text-slate-700 dark:text-slate-300">{itemVariant}</span></p>
                        )}
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                          <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:bg-slate-100">
                            <MinusIcon className="h-3.5 w-3.5 stroke-2" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-900 dark:text-white w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:bg-slate-100">
                            <PlusIcon className="h-3.5 w-3.5 stroke-2" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.variantId)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Item">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
          </div>
          
          {/* Kolom Kanan: Ringkasan Pesanan */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 sticky top-24">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Ringkasan</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal ({cartCount} item)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Estimasi Ongkos Kirim</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Gratis</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-slate-900 dark:text-white">Total Akhir</span>
                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {(!isAddressValid || isEditingAddress) ? (
                  <div className="mt-8">
                      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
                          <ExclamationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-800 dark:text-amber-400 font-medium text-xs leading-relaxed">
                              {isEditingAddress 
                                ? "Silakan simpan Alamat Pengiriman Anda terlebih dahulu untuk membuka opsi pembayaran." 
                                : "Lengkapi form Alamat Pengiriman Anda terlebih dahulu sebelum membayar."}
                          </p>
                      </div>
                  </div>
              ) : (
                  <div className="mt-8 space-y-5 animate-in fade-in">
                    {profile && profile.role !== 'admin' && (
                        <>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pilih Metode Pembayaran</p>
                                
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                                            <WalletIcon className="h-5 w-5 text-indigo-500" />
                                            Core Wallet
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(walletBalance)}</p>
                                    </div>
                                    
                                    {!isWalletSufficient && (
                                        <p className="text-[11px] text-rose-500 font-medium mt-1 mb-3">Saldo Anda tidak mencukupi.</p>
                                    )}
                                    
                                    <button
                                        onClick={handleWalletPaymentClick}
                                        disabled={!isWalletSufficient || isProcessing}
                                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                                    >
                                        Bayar via Wallet
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center py-2">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold tracking-wider uppercase">ATAU</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            
                            <div className="rounded-xl overflow-hidden shadow-sm">
                                <PayPalPayment 
                                    cartItems={cartItems} 
                                    shippingAddress={currentShippingAddress} 
                                />
                            </div>
                        </>
                    )}
                    
                    {profile && profile.role === 'admin' && (
                        <div className="mt-8">
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">
                                <p className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Mode Admin: Saldo dompet dinonaktifkan. Silakan gunakan metode pembayaran eksternal (PayPal) untuk simulasi pesanan.
                                </p>
                            </div>
                            <PayPalPayment 
                                cartItems={cartItems} 
                                shippingAddress={currentShippingAddress} 
                            />
                        </div>
                    )}

                    {!profile && (
                        <div className="flex justify-center py-4">
                            <div className="animate-pulse flex items-center gap-2 text-sm text-slate-500">
                                <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                Memuat opsi...
                            </div>
                        </div>
                    )}
                  </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}