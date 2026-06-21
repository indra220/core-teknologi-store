// src/app/products/ProductList.tsx

'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import NavigationLoader from '@/components/NavigationLoader'; 
import Image from 'next/image';
import { Product as BaseProduct, ProductVariant } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

type Product = BaseProduct & { price?: number };

// --- IKON-IKON ---
const ChevronDownIcon = () => <svg className="h-4 w-4 transition-transform text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>;
const BrandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925v3m0 0l-5.25 5.25m-7.5-5.25l5.25 5.25m-1.5-5.25l-1.5 1.5" /></svg>;
const CpuChipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M19.5 8.25h1.5M19.5 12h1.5m0 3.75h1.5M15.75 21v-1.5M12 4.5v15" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6H9v12H5.25V6zM15 6h3.75v12H15V6z" /></svg>;
const RamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 0h10.5c.621 0 1.125-.504 1.125-1.125v-15c0-.621-.504-1.125-1.125-1.125H6.375c-.621 0-1.125.504-1.125 1.125v15c0 .621.504 1.125 1.125 1.125z" /></svg>;
const StorageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0-2.25l2.25 1.313M4.5 9.75v1.5M19.5 9.75v1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GraphicsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>;
const PriceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ScreenSizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m-6 0h6" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v-7.5c0-.934.716-1.687 1.66-1.744A48.52 48.52 0 0112 4.5c2.278 0 4.542.164 6.74 1.012A1.72 1.72 0 0121 7.25v7.5" /></svg>;

const CheckboxItem = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
  <label
    htmlFor={id}
    className="flex w-full items-center space-x-3 text-sm px-3 py-2.5 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
  >
    <input
      type="checkbox"
      id={id}
      name={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 shadow-sm"
    />
    <span className="font-medium">{label}</span>
  </label>
);

const FilterDropdown = ({ title, icon, children, selectionCount }: { title: string; icon: React.ReactNode; children: React.ReactNode; selectionCount: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-3 rounded-xl transition-colors">
        <span className="flex items-center space-x-3">
          {icon}
          <span className="text-sm">{title} {selectionCount > 0 && <span className="text-indigo-500 ml-1">({selectionCount})</span>}</span>
        </span>
        <span className={`${isOpen ? 'rotate-180' : ''} transition-transform duration-300`}><ChevronDownIcon/></span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-1 pb-3 px-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface BrandWithCount { brand: string; count: number; }
interface ProductListProps { allProducts: Product[]; allBrands: BrandWithCount[]; }

const groupProcessor = (processor: string): string => {
  const p = processor.toLowerCase();
  if (p.includes('core™ ultra 9')) return 'Intel® Core™ Ultra 9';
  if (p.includes('core™ ultra 7')) return 'Intel® Core™ Ultra 7';
  if (p.includes('core™ ultra 5')) return 'Intel® Core™ Ultra 5';
  if (p.includes('ryzen™ ai 9')) return 'AMD Ryzen™ AI 9';
  if (p.includes('ryzen™ ai 7 350')) return 'AMD Ryzen™ AI 7 350';
  if (p.includes('ryzen™ ai 5 340')) return 'AMD Ryzen™ AI 5 340';
  if (p.includes('snapdragon® x elite')) return 'Qualcomm Snapdragon® X Elite';
  if (p.includes('snapdragon® x plus')) return 'Qualcomm Snapdragon® X Plus';
  if (p.includes('core™ i9')) return 'Intel® Core™ i9';
  if (p.includes('core™ i7')) return 'Intel® Core™ i7';
  if (p.includes('core™ i5')) return 'Intel® Core™ i5';
  if (p.includes('core™ i3')) return 'Intel® Core™ i3';
  if (p.includes('ryzen™ 9')) return 'AMD Ryzen™ 9';
  if (p.includes('ryzen™ 7')) return 'AMD Ryzen™ 7';
  if (p.includes('ryzen™ 5')) return 'AMD Ryzen™ 5';
  if (p.includes('ryzen™ 3')) return 'AMD Ryzen™ 3';
  if (p.includes('celeron')) return 'Intel® Celeron®';
  if (p.includes('qualcomm')) return 'Qualcomm';
  if (p.includes('snapdragon® x x1')) return 'Snapdragon® X X1';
  if (p.includes('snapdragon')) return 'Snapdragon';
  return 'Lainnya';
};
const groupRam = (ram: string): string => {
  const r = ram.toLowerCase();
  if (r.includes('32gb')) return '32GB';
  if (r.includes('16gb')) return '16GB';
  if (r.includes('8gb')) return '8GB';
  if (r.includes('4gb')) return '4GB';
  return 'Lainnya';
};
const groupStorage = (storage: string): string => {
    const s = storage.toLowerCase();
    const isTB = s.includes('tb');
    const size = parseInt(s.match(/\d+/)?.[0] || '0', 10);
    const sizeInGB = isTB ? size * 1024 : size;

    if (sizeInGB >= 1000) return '1TB and up';
    if (sizeInGB >= 256 && sizeInGB <= 512) return '256GB - 512GB';
    if (sizeInGB > 0 && sizeInGB < 256) return 'Less than 256GB';
    return 'Lainnya';
};
const groupGraphics = (productName: string, variants: ProductVariant[]): string => {
  const name = productName.toLowerCase();
  if (name.includes('rtx')) return 'NVIDIA® GeForce® RTX™';
  if (name.includes('geforce')) return 'NVIDIA® GeForce®';
  if (name.includes('radeon')) return 'AMD Radeon Vega';
  if (name.includes('adreno')) return 'Qualcomm® Adreno™';
  const hasRadeon = variants.some(v => v.processor && v.processor.toLowerCase().includes('radeon'));
  if (hasRadeon) return 'AMD Radeon Vega';
  const hasAdreno = variants.some(v => v.processor && v.processor.toLowerCase().includes('adreno'));
  if (hasAdreno) return 'Qualcomm® Adreno™';
  return 'Integrated Graphics';
};
const groupPrice = (price: number): string | null => {
  if (price >= 0 && price <= 10000000) return '0-10000000';
  if (price > 10000000 && price <= 20000000) return '10000000-20000000';
  if (price > 20000000) return '20000001-Infinity';
  return null;
};
const groupScreenSize = (screenSize: string | null): string | null => {
  if (!screenSize) return null;
  const sizeValue = parseFloat(screenSize.replace(',', '.').match(/(\d+\.?\d*)/)?.[0] || '');
  if (isNaN(sizeValue)) return null;
  if (sizeValue < 12) return '<12';
  if (sizeValue >= 12 && sizeValue <= 14.9) return '12-14';
  if (sizeValue >= 15 && sizeValue <= 16.9) return '15-16';
  if (sizeValue > 16) return '>16';
  return null;
};

const STATIC_PROCESSOR_CATEGORIES = [ 'Intel® Core™ i3', 'Intel® Core™ i5', 'Intel® Core™ i7', 'Intel® Core™ i9', 'Intel® Core™ Ultra 5', 'Intel® Core™ Ultra 7', 'Intel® Core™ Ultra 9', 'AMD Ryzen™ 3', 'AMD Ryzen™ 5', 'AMD Ryzen™ 7', 'AMD Ryzen™ 9', 'AMD Ryzen™ AI 9', 'Qualcomm Snapdragon® X Elite', 'Qualcomm Snapdragon® X Plus' ];
const STATIC_RAM_CATEGORIES = ['4GB', '8GB', '16GB', '32GB'];
const STATIC_STORAGE_CATEGORIES = ['Less than 256GB', '256GB - 512GB', '1TB and up'];
const STATIC_GRAPHICS_CATEGORIES = ['Integrated Graphics', 'NVIDIA® GeForce®', 'NVIDIA® GeForce® RTX™', 'AMD Radeon Vega', 'Qualcomm® Adreno™'];
const PRICE_RANGE_MAP = {
  '0-10000000': 'Di bawah Rp 10 jt',
  '10000000-20000000': 'Rp 10 jt - Rp 20 jt',
  '20000001-Infinity': 'Di atas Rp 20 jt',
};
const STATIC_PRICE_RANGES = Object.keys(PRICE_RANGE_MAP);
const SCREEN_SIZE_MAP = {
  '<12': 'Kurang dari 12"',
  '12-14': '12" - 14"',
  '15-16': '15" - 16"',
  '>16': 'Lebih dari 16"',
};
const STATIC_SCREEN_SIZES = Object.keys(SCREEN_SIZE_MAP);

export default function ProductList({ allProducts, allBrands }: ProductListProps) {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [selectedRams, setSelectedRams] = useState<string[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<string[]>([]);
  const [selectedGraphics, setSelectedGraphics] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedScreenSizes, setSelectedScreenSizes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('default');

  const handleCheckboxChange = (value: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setState(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };
  
  const resetFilters = () => {
    setSelectedBrands([]); setSelectedPriceRanges([]); setSelectedScreenSizes([]);
    setSelectedProcessors([]); setSelectedRams([]); setSelectedStorages([]); setSelectedGraphics([]);
    setSortOrder('default');
  };

  const filterCounts = useMemo(() => {
    const processorCounts = new Map<string, number>();
    const ramCounts = new Map<string, number>();
    const storageCounts = new Map<string, number>();
    const graphicsCounts = new Map<string, number>();
    const priceCounts = new Map<string, number>();
    const screenSizeCounts = new Map<string, number>();

    const countProducts = (
      categoryMap: Map<string, number>,
      getGroup: (variant: ProductVariant) => string | null,
      getGroupFromProduct?: (product: Product) => string | null
    ) => {
      const productIdsByCategory = new Map<string, Set<string>>();

      allProducts.forEach(product => {
        const variants = product.product_variants || [];
        
        if (getGroupFromProduct) {
          const group = getGroupFromProduct(product);
          if (group) {
            if (!productIdsByCategory.has(group)) productIdsByCategory.set(group, new Set());
            productIdsByCategory.get(group)!.add(product.id);
          }
        } else {
          variants.forEach(variant => {
            const group = getGroup(variant);
            if (group) {
              if (!productIdsByCategory.has(group)) productIdsByCategory.set(group, new Set());
              productIdsByCategory.get(group)!.add(product.id);
            }
          });
        }
      });
      productIdsByCategory.forEach((idSet, group) => {
        categoryMap.set(group, idSet.size);
      });
    };
    
    countProducts(processorCounts, v => v.processor ? groupProcessor(v.processor) : null);
    countProducts(ramCounts, v => v.ram ? groupRam(v.ram) : null);
    countProducts(storageCounts, v => v.storage ? groupStorage(v.storage) : null);
    countProducts(screenSizeCounts, v => groupScreenSize(v.screen_size));
    
    countProducts(priceCounts, () => null, p => groupPrice(p.price || 0));
    
    countProducts(graphicsCounts, () => null, p => {
      const laptopData = Array.isArray(p.laptops) ? p.laptops[0] : p.laptops;
      return groupGraphics(laptopData?.name || '', p.product_variants || []);
    });

    return { processorCounts, ramCounts, storageCounts, graphicsCounts, priceCounts, screenSizeCounts };
  }, [allProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let products = [...allProducts];

    if (searchTerm) {
      products = products.filter(p => {
        const laptopData = Array.isArray(p.laptops) ? p.laptops[0] : p.laptops;
        return laptopData?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedBrands.length > 0) {
      products = products.filter(p => {
        const laptopData = Array.isArray(p.laptops) ? p.laptops[0] : p.laptops;
        return selectedBrands.includes(laptopData?.brand || '');
      });
    }
    
    if (selectedProcessors.length > 0) {
      products = products.filter(p => (p.product_variants || []).some(v => v.processor && selectedProcessors.includes(groupProcessor(v.processor))));
    }
    if (selectedRams.length > 0) {
      products = products.filter(p => (p.product_variants || []).some(v => v.ram && selectedRams.includes(groupRam(v.ram))));
    }
    if (selectedStorages.length > 0) {
      products = products.filter(p => (p.product_variants || []).some(v => v.storage && selectedStorages.includes(groupStorage(v.storage))));
    }
    
    if (selectedPriceRanges.length > 0) {
      products = products.filter(p => {
        const priceGroup = groupPrice(p.price || 0);
        return priceGroup && selectedPriceRanges.includes(priceGroup);
      });
    }
    
    if (selectedScreenSizes.length > 0) {
        products = products.filter(p => (p.product_variants || []).some(v => {
            const sizeGroup = groupScreenSize(v.screen_size);
            return sizeGroup && selectedScreenSizes.includes(sizeGroup);
        }));
    }

    if (selectedGraphics.length > 0) {
      products = products.filter(p => {
        const laptopData = Array.isArray(p.laptops) ? p.laptops[0] : p.laptops;
        const group = groupGraphics(laptopData?.name || '', p.product_variants || []);
        return selectedGraphics.includes(group);
      });
    }

    if (sortOrder === 'price-asc') products.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortOrder === 'price-desc') products.sort((a, b) => (b.price || 0) - (a.price || 0));

    return products;
  }, [searchTerm, selectedBrands, selectedPriceRanges, selectedScreenSizes, selectedProcessors, selectedRams, selectedStorages, selectedGraphics, sortOrder, allProducts]);
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Panel Filter */}
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-4 sticky top-24">
          <div className="flex justify-between items-center mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Filter Produk</h2>
            <button onClick={resetFilters} className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
              <ResetIcon />
              <span>Reset</span>
            </button>
          </div>
          
          <div className="space-y-1">
              <FilterDropdown title="Brand" icon={<BrandIcon/>} selectionCount={selectedBrands.length}>
                {allBrands.map(({ brand, count }) => (
                  <CheckboxItem key={brand} id={brand} label={`${brand} (${count})`} checked={selectedBrands.includes(brand)} onChange={() => handleCheckboxChange(brand, selectedBrands, setSelectedBrands)} />
                ))}
              </FilterDropdown>

              <FilterDropdown title="Processor" icon={<CpuChipIcon/>} selectionCount={selectedProcessors.length}>
                {STATIC_PROCESSOR_CATEGORIES.map((group) => {
                    const count = filterCounts.processorCounts.get(group) || 0;
                    return <CheckboxItem key={group} id={group} label={`${group} (${count})`} checked={selectedProcessors.includes(group)} onChange={() => handleCheckboxChange(group, selectedProcessors, setSelectedProcessors)} />
                })}
              </FilterDropdown>

              <FilterDropdown title="Memory (RAM)" icon={<RamIcon/>} selectionCount={selectedRams.length}>
                 {STATIC_RAM_CATEGORIES.map((group) => {
                    const count = filterCounts.ramCounts.get(group) || 0;
                    return <CheckboxItem key={group} id={`ram-${group}`} label={`${group} RAM (${count})`} checked={selectedRams.includes(group)} onChange={() => handleCheckboxChange(group, selectedRams, setSelectedRams)} />
                })}
              </FilterDropdown>

              <FilterDropdown title="Storage" icon={<StorageIcon/>} selectionCount={selectedStorages.length}>
                {STATIC_STORAGE_CATEGORIES.map((group) => {
                    const count = filterCounts.storageCounts.get(group) || 0;
                    return <CheckboxItem key={group} id={`storage-${group}`} label={`${group} (${count})`} checked={selectedStorages.includes(group)} onChange={() => handleCheckboxChange(group, selectedStorages, setSelectedStorages)} />
                })}
              </FilterDropdown>
              
              <FilterDropdown title="Graphics" icon={<GraphicsIcon/>} selectionCount={selectedGraphics.length}>
                {STATIC_GRAPHICS_CATEGORIES.map((group) => {
                    const count = filterCounts.graphicsCounts.get(group) || 0;
                    return <CheckboxItem key={group} id={`graphics-${group}`} label={`${group} (${count})`} checked={selectedGraphics.includes(group)} onChange={() => handleCheckboxChange(group, selectedGraphics, setSelectedGraphics)} />
                })}
              </FilterDropdown>

              <FilterDropdown title="Harga" icon={<PriceIcon/>} selectionCount={selectedPriceRanges.length}>
                {STATIC_PRICE_RANGES.map((range) => {
                    const count = filterCounts.priceCounts.get(range) || 0;
                    const label = PRICE_RANGE_MAP[range as keyof typeof PRICE_RANGE_MAP];
                    return <CheckboxItem key={range} id={range} label={`${label} (${count})`} checked={selectedPriceRanges.includes(range)} onChange={() => handleCheckboxChange(range, selectedPriceRanges, setSelectedPriceRanges)} />
                })}
              </FilterDropdown>

              <FilterDropdown title="Ukuran Layar" icon={<ScreenSizeIcon/>} selectionCount={selectedScreenSizes.length}>
                {STATIC_SCREEN_SIZES.map((range) => {
                    const count = filterCounts.screenSizeCounts.get(range) || 0;
                    const label = SCREEN_SIZE_MAP[range as keyof typeof SCREEN_SIZE_MAP];
                    return <CheckboxItem key={range} id={range} label={`${label} (${count})`} checked={selectedScreenSizes.includes(range)} onChange={() => handleCheckboxChange(range, selectedScreenSizes, setSelectedScreenSizes)} />
                })}
              </FilterDropdown>
          </div>
        </div>
      </aside>

      {/* Area Grid Produk */}
      <main className="w-full md:w-3/4 lg:w-4/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
             Menampilkan <span className="font-bold text-slate-900 dark:text-white"> {filteredAndSortedProducts.length} </span> dari <span className="font-bold text-slate-900 dark:text-white">{allProducts.length}</span> produk
          </p>
          
          <div className="relative">
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)} 
                className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2 text-sm font-semibold border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 shadow-sm outline-none cursor-pointer"
              >
                <option value="default">Urutkan: Relevansi</option>
                <option value="price-asc">Harga: Terendah</option>
                <option value="price-desc">Harga: Tertinggi</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDownIcon />
              </div>
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product: Product) => {
              const laptopData = Array.isArray(product.laptops) ? product.laptops[0] : product.laptops;
              const displayPrice = product.price || 0;

              return (
                <div key={product.id} className="group bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden flex flex-col">
                  
                  {/* Container Gambar: PERBAIKAN, Dihapus class 'block' agar tidak berkonflik dengan 'flex' */}
                  <NavigationLoader href={`/laptop/${product.id}`} className="relative aspect-[4/3] w-full bg-slate-50 dark:bg-slate-900/50 overflow-hidden p-4 flex items-center justify-center">
                    <Image 
                        src={laptopData?.image_url || '/placeholder.png'} 
                        alt={laptopData?.name || 'Produk'} 
                        fill 
                        className="object-contain p-6 transition-transform duration-500 group-hover:scale-110 drop-shadow-md" 
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </NavigationLoader>
                  
                  <div className="p-5 flex flex-col flex-grow border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit mb-3">
                        {laptopData?.brand || '-'}
                    </span>
                    
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug flex-grow group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <NavigationLoader href={`/laptop/${product.id}`}>
                        {laptopData?.name || 'Produk Tanpa Nama'}
                      </NavigationLoader>
                    </h3>
                    
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(displayPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800 border-dashed shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Produk Tidak Ditemukan</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">Cobalah untuk melonggarkan kriteria filter Anda atau hapus filter untuk melihat semua produk kami.</p>
            <button 
                onClick={resetFilters} 
                className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
            >
                Tampilkan Semua
            </button>
          </div>
        )}
      </main>
    </div>
  );
}