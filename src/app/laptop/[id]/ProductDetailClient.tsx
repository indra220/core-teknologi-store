'use client';

import { useState, useEffect } from "react";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ProductDetailClient({ formattedPrice, productName }: { formattedPrice: string; productName: string }) {
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const { showNotification } = useNotification();
  const router = useRouter();

  // Ambil data user saat komponen dimuat untuk mengetahui status login
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleAddToCart = () => {
    // Cek apakah user sudah login
    if (!user) {
      // Jika belum, tampilkan notifikasi error dan arahkan ke halaman login
      showNotification('Anda harus login terlebih dahulu!', 'error');
      router.push('/login');
      return; // Hentikan eksekusi
    }

    // Jika sudah login, lanjutkan logika seperti biasa
    // Di sini Anda bisa menambahkan logika untuk menyimpan ke keranjang (misalnya, localStorage atau database)
    showNotification(`${quantity} "${productName}" ditambahkan ke keranjang!`, 'success');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: productName,
        text: `Lihat produk ${productName} di Core Teknologi Store!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('Link produk disalin ke clipboard!', 'info');
    }
  };

  return (
    <div className="mt-auto pt-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <p className="text-4xl sm:text-5xl font-bold text-blue-700">
          {formattedPrice}
        </p>
        <div className="flex items-center border border-gray-300 rounded-xl mt-4 sm:mt-0 shadow-sm">
          <button 
            onClick={() => setQuantity(q => Math.max(1, q - 1))} 
            className="px-5 py-3 text-xl font-bold text-gray-700 hover:bg-gray-100 rounded-l-xl"
            aria-label="Kurangi jumlah"
          >
            -
          </button>
          <span className="px-6 text-lg font-semibold text-center w-16 border-x text-gray-900">
            {quantity}
          </span>
          <button 
            onClick={() => setQuantity(q => q + 1)} 
            className="px-5 py-3 text-xl font-bold text-gray-700 hover:bg-gray-100 rounded-r-xl"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleAddToCart}
          type="button"
          className="flex-grow py-4 px-6 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition duration-300 shadow-lg transform hover:-translate-y-1"
        >
          + Tambah ke Keranjang
        </button>
        <button 
          onClick={handleShare}
          type="button" 
          className="p-4 rounded-xl bg-gray-200 hover:bg-gray-300 transition" 
          title="Bagikan produk ini"
        >
          <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367-2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
        </button>
      </div>
    </div>
  );
}