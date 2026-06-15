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
import { createOrderFromWallet, ShippingAddress } from "./actions";
import { useNotification } from "@/components/notifications/NotificationProvider";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useRouter } from "next/navigation";
import NProgress from 'nprogress'; 

const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;
const ConfirmationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25-2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 3V9a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18-3h-2.25a2.25 2.25 0 0 0-2.25 2.25V9M3 9V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V9" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>;

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
  
  // State untuk mengontrol visibilitas form vs kartu alamat
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

  // OBJEK ALAMAT: Disusun untuk dikirim ke PayPal dan Wallet Payment
  const currentShippingAddress: ShippingAddress = {
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

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    NProgress.start(); 

    const result = await createOrderFromWallet(cartItems, currentShippingAddress);
    
    if (result.success) {
      showNotification(result.message, 'success');
      clearClientCart();
      router.push('/orders?status=success');
    } else {
      setIsProcessing(false);
      setIsModalOpen(false);
      showNotification(result.message, 'error');
      NProgress.done(); 
    }
  };

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
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <MapPinIcon />
                    Alamat Pengiriman
                  </h2>
                  
                  {!isEditingAddress && (
                     <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg"
                     >
                        <PencilIcon />
                        Ubah Alamat
                     </button>
                  )}
              </div>

              {isEditingAddress ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                     <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Alamat Lengkap <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          required 
                          rows={3} 
                          value={addressLine1} 
                          onChange={e => setAddressLine1(e.target.value)} 
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow" 
                          placeholder="Contoh: Jl. Merdeka No. 123, RT 01/RW 02, Kec. Tawang"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Kota / Kabupaten <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={city} 
                          onChange={e => setCity(e.target.value)} 
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow" 
                          placeholder="Contoh: Tasikmalaya" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Provinsi <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={province} 
                          onChange={e => setProvince(e.target.value)} 
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow" 
                          placeholder="Contoh: Jawa Barat" 
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Kode Pos <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={postalCode} 
                          onChange={e => setPostalCode(e.target.value)} 
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-shadow" 
                          placeholder="Contoh: 46115" 
                        />
                     </div>
                     <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                         <button 
                            type="button"
                            onClick={handleCancelAddress}
                            disabled={isSavingAddress}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm disabled:bg-gray-400 disabled:opacity-50"
                         >
                            Batal
                         </button>
                         <button 
                            onClick={handleSaveAddress}
                            disabled={isSavingAddress}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md disabled:bg-gray-400"
                         >
                            {isSavingAddress ? 'Menyimpan...' : 'Simpan Alamat'}
                         </button>
                     </div>
                  </div>
              ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2 uppercase tracking-wide">
                          {profile?.full_name || profile?.username || 'Pelanggan'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                          {addressLine1}<br/>
                          {city}, {province} {postalCode}<br/>
                          Indonesia
                      </p>
                  </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
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
            
          </div>
          
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

              {(!isAddressValid || isEditingAddress) ? (
                  <div className="mt-8 border-t dark:border-gray-600 pt-6">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center">
                          <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                              {isEditingAddress 
                                ? "Silakan simpan Alamat Pengiriman Anda terlebih dahulu untuk melanjutkan pembayaran." 
                                : "Silakan lengkapi form Alamat Pengiriman di samping terlebih dahulu untuk membuka opsi pembayaran."}
                          </p>
                      </div>
                  </div>
              ) : (
                  <>
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
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm"
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
                            <PayPalPayment 
                                cartItems={cartItems} 
                                shippingAddress={currentShippingAddress} 
                            />
                        </div>
                    )}
                    
                    {profile && profile.role === 'admin' && (
                        <div className="mt-8">
                            <p className="text-center text-sm mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">Admin tidak dapat menggunakan saldo dompet. Silakan gunakan metode pembayaran lain.</p>
                            <PayPalPayment 
                                cartItems={cartItems} 
                                shippingAddress={currentShippingAddress} 
                            />
                        </div>
                    )}

                    {!profile && (
                        <div className="mt-8 text-center text-sm p-3 text-gray-500">
                            Memuat opsi pembayaran...
                        </div>
                    )}
                  </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}