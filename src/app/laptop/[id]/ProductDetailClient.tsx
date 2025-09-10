// src/app/laptop/[id]/ProductDetailClient.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Product, ProductVariant } from "@/types";
import { useCart } from "@/context/CartContext";

// --- Helper Functions untuk Menyederhanakan Label ---
const simplifyProcessor = (spec: string | null): string => {
  if (!spec) return 'N/A';
  // Mencoba mencocokkan pola umum seperti "Intel Core iX-XXXX" atau "AMD Ryzen X XXXX"
  const match = spec.match(/(Intel® Core™ (?:i\d|Ultra \d)-\w+|AMD Ryzen™ (?:AI )?\d \w+)/);
  return match ? match[0] : spec.split('/')[0].trim();
};

// --- PERBAIKAN DI SINI ---
const simplifyRam = (spec: string | null): string => {
  if (!spec) return 'N/A';
  const s = spec.toUpperCase();
  
  const sizeMatch = s.match(/(\d+\s*GB)/);
  if (!sizeMatch) return spec; // Jika ukuran tidak ditemukan, kembalikan teks asli
  const size = sizeMatch[0].replace(/\s/g, ''); // Hasilnya "8GB"

  // Periksa jenis DDR
  if (s.includes('DDR5') || s.includes('LPDDR5')) {
    return `${size} DDR5`;
  }
  if (s.includes('DDR4') || s.includes('LPDDR4')) {
    return `${size} DDR4`;
  }
  
  return size; // Fallback jika jenis DDR tidak ditemukan
};
// --- AKHIR PERBAIKAN ---

const simplifyStorage = (spec: string | null): string => {
  if (!spec) return 'N/A';
  const sizeMatch = spec.match(/(\d+(GB|TB))/);
  const typeMatch = spec.toLowerCase().includes('nvme') ? 'NVMe SSD' : 'SSD';
  return sizeMatch ? `${sizeMatch[0]} ${typeMatch}` : spec;
};

// --- Komponen untuk Grup Pilihan Varian ---
interface VariantOptionGroupProps {
  title: string;
  options: string[];
  getLabel: (option: string) => string;
  selectedValue: string | null;
  onSelect: (value: string) => void;
  isOptionDisabled: (option: string) => boolean;
}

function VariantOptionGroup({ title, options, getLabel, selectedValue, onSelect, isOptionDisabled }: VariantOptionGroupProps) {
  if (options.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isDisabled = isOptionDisabled(option);
          const isSelected = option === selectedValue;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              disabled={isDisabled}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ease-in-out
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 ring-2 ring-blue-500/50'
                  : 'border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 hover:border-blue-500'}
                ${isDisabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700/50 dark:border-gray-700 opacity-60'
                  : ''}
              `}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Daftar Kategori Statis ---
const STATIC_RAM_OPTIONS = ['8GB DDR5', '16GB DDR5', '32GB DDR5', '8GB DDR4', '16GB DDR4'];
const STATIC_STORAGE_OPTIONS = ['256GB NVMe SSD', '512GB NVMe SSD', '1TB NVMe SSD', '256GB SSD', '512GB SSD'];


export default function ProductDetailClient({ product }: { product: Product }) {
  const allVariants = useMemo(() => product.product_variants || [], [product.product_variants]);

  const { addToCart } = useCart();
  const { showNotification } = useNotification();
  const router = useRouter();

  // State untuk menyimpan pilihan (menggunakan spesifikasi LENGKAP dari DB)
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [selectedRam, setSelectedRam] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<User | null>(null);

  // Opsi prosesor dinamis dari produk
  const processorOptions = useMemo(() => [...new Set(allVariants.map(v => v.processor).filter(Boolean))] as string[], [allVariants]);

  // Inisialisasi state saat komponen pertama kali dimuat
  useEffect(() => {
    const firstAvailableVariant = allVariants.find(v => v.stock > 0) || allVariants[0];
    if (firstAvailableVariant) {
      setSelectedProcessor(firstAvailableVariant.processor);
      setSelectedRam(firstAvailableVariant.ram);
      setSelectedStorage(firstAvailableVariant.storage);
    }
  }, [allVariants]);

  // Cari varian yang cocok setiap kali ada perubahan pilihan
  useEffect(() => {
    const foundVariant = allVariants.find(v => 
      v.processor === selectedProcessor &&
      v.ram === selectedRam &&
      v.storage === selectedStorage
    );
    setCurrentVariant(foundVariant || null);
    setQuantity(1); // Reset kuantitas setiap ganti varian
  }, [selectedProcessor, selectedRam, selectedStorage, allVariants]);
  
  // Handler saat memilih Prosesor (pilihan utama)
  const handleProcessorSelect = (processorSpec: string) => {
    // Cari varian pertama yang cocok dengan prosesor baru
    const compatibleVariant = allVariants.find(v => v.processor === processorSpec && v.stock > 0) || allVariants.find(v => v.processor === processorSpec);
    if (compatibleVariant) {
      setSelectedProcessor(compatibleVariant.processor);
      setSelectedRam(compatibleVariant.ram);
      setSelectedStorage(compatibleVariant.storage);
    }
  };
  
  // Handler untuk RAM & Storage
  const handleRamSelect = (simpleRam: string) => {
    // Cari varian yang cocok dengan prosesor saat ini dan RAM baru
    const targetVariant = allVariants.find(v => v.processor === selectedProcessor && simplifyRam(v.ram) === simpleRam);
    if (targetVariant) setSelectedRam(targetVariant.ram);
  };
  
  const handleStorageSelect = (simpleStorage: string) => {
     const targetVariant = allVariants.find(v => v.processor === selectedProcessor && simplifyStorage(v.storage) === simpleStorage);
    if (targetVariant) setSelectedStorage(targetVariant.storage);
  };

  // Fungsi untuk menonaktifkan tombol jika kombinasinya tidak ada DENGAN PROSESOR YANG DIPILIH
  const isRamDisabled = useCallback((simpleRam: string): boolean => {
    return !allVariants.some(v => v.processor === selectedProcessor && simplifyRam(v.ram) === simpleRam);
  }, [selectedProcessor, allVariants]);

  const isStorageDisabled = useCallback((simpleStorage: string): boolean => {
    return !allVariants.some(v => v.processor === selectedProcessor && simplifyStorage(v.storage) === simpleStorage);
  }, [selectedProcessor, allVariants]);


  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleAddToCart = () => {
    if (!user) {
      showNotification('Anda harus login terlebih dahulu!', 'error');
      router.push('/login');
      return;
    }
    if (currentVariant) {
      addToCart(product, currentVariant, quantity);
    } else {
        showNotification('Kombinasi varian tidak valid.', 'error');
    }
  };

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(currentVariant?.price || 0);

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
      
      <VariantOptionGroup
        title="Prosesor"
        options={processorOptions}
        getLabel={(spec) => simplifyProcessor(spec)}
        selectedValue={selectedProcessor}
        onSelect={handleProcessorSelect}
        isOptionDisabled={() => false} // Opsi prosesor tidak pernah disable
      />
      <VariantOptionGroup
        title="RAM"
        options={STATIC_RAM_OPTIONS}
        getLabel={(spec) => spec} // Label sudah simple
        selectedValue={simplifyRam(selectedRam)}
        onSelect={handleRamSelect}
        isOptionDisabled={isRamDisabled}
      />
      <VariantOptionGroup
        title="Penyimpanan"
        options={STATIC_STORAGE_OPTIONS}
        getLabel={(spec) => spec} // Label sudah simple
        selectedValue={simplifyStorage(selectedStorage)}
        onSelect={handleStorageSelect}
        isOptionDisabled={isStorageDisabled}
      />

      <div className="mt-auto pt-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
              <p className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400">
                {currentVariant ? formattedPrice : 'Pilih Varian'}
              </p>
               <p className={`mt-2 font-semibold ${currentVariant && currentVariant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {currentVariant ? `Stok: ${currentVariant.stock}` : 'Kombinasi tidak tersedia'}
              </p>
          </div>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl mt-4 sm:mt-0 shadow-sm">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))} 
              className="px-5 py-3 text-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl"
            >
              -
            </button>
            <span className="px-6 text-lg font-semibold text-center w-16 text-gray-900 dark:text-white">{quantity}</span>
            <button 
              onClick={() => setQuantity(q => currentVariant && q < currentVariant.stock ? q + 1 : q)} 
              disabled={!currentVariant || quantity >= currentVariant.stock}
              className="px-5 py-3 text-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!currentVariant || currentVariant.stock === 0}
          className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {!currentVariant ? 'Varian Tidak Tersedia' : currentVariant.stock > 0 ? '+ Tambah ke Keranjang' : 'Stok Habis'}
        </button>
      </div>
    </div>
  );
}