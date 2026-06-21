// src/app/admin/GlobalSearch.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ShoppingBagIcon, 
  XMarkIcon,
  InboxStackIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateDisplayId = (order: any) => {
    if (!order) return 'INV-UNKNOWN';
    const date = new Date(order.created_at || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dStr = `${yy}${mm}${dd}`;
    
    const firstItem = order.order_items?.[0];
    const categoryChar = firstItem?.product_name ? firstItem.product_name.charAt(0).toUpperCase() : 'P';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalQty = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
    const uniqueTail = order.id ? order.id.split('-')[0].substring(0, 4).toUpperCase() : 'XXXX';
    
    return `${dStr}${categoryChar}${totalQty}-${uniqueTail}`;
};

type SearchResult = {
  products: { product_id: string; name: string; brand: string | null }[];
  users: { id: string; full_name: string | null; username: string | null; email: string | null }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ products: [], users: [], orders: [] });
  
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      const term = query.trim();
      
      if (!term) {
        setResults({ products: [], users: [], orders: [] });
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        // PERBAIKAN: Menambahkan .eq('role', 'user') agar tidak mencari Admin
        const fetchUsers = supabase
          .from('profiles')
          .select('id, full_name, username, email')
          .eq('role', 'user')
          .or(`full_name.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(3);

        const fetchProducts = supabase
          .from('laptops')
          .select('product_id, name, brand')
          .or(`name.ilike.%${term}%,brand.ilike.%${term}%`)
          .limit(4);

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
        
        const [usersRes, productsRes] = await Promise.all([
          fetchUsers, 
          fetchProducts
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let matchedOrders: any[] = [];
        
        if (isUUID) {
          const { data } = await supabase
            .from('orders')
            .select('id, status, created_at, profiles(full_name), order_items(product_name, quantity)')
            .eq('id', term)
            .limit(1);
            
          matchedOrders = data || [];
        } else {
          const { data } = await supabase
            .from('orders')
            .select('id, status, created_at, profiles(full_name), order_items(product_name, quantity)')
            .order('created_at', { ascending: false })
            .limit(200); 
            
          if (data) {
             const lowerTerm = term.toLowerCase();
             matchedOrders = data.filter(o => {
                 const displayId = generateDisplayId(o).toLowerCase();
                 const profileObj = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
                 const customerName = (profileObj?.full_name || '').toLowerCase();
                 
                 return displayId.includes(lowerTerm) || customerName.includes(lowerTerm);
             }).slice(0, 3);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedOrders = matchedOrders.map((o: any) => ({
           ...o,
           profiles: Array.isArray(o.profiles) ? o.profiles[0] : o.profiles
        }));

        setResults({
          users: usersRes.data || [],
          products: productsRes.data || [],
          orders: formattedOrders
        });
      } catch (error) {
        console.error("Gagal melakukan pencarian:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, supabase]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const hasResults = results.products.length > 0 || results.users.length > 0 || results.orders.length > 0;

  return (
    <div ref={wrapperRef} className="relative flex flex-1 w-full max-w-2xl">
      <div className="relative flex flex-1 items-center">
        <MagnifyingGlassIcon className="absolute left-0 h-5 w-5 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="block h-full w-full border-0 py-0 pl-8 pr-8 text-slate-900 dark:text-white bg-transparent placeholder:text-slate-400 focus:ring-0 sm:text-sm outline-none"
          placeholder="Cari pengguna, pesanan, produk, atau kategori..."
          autoComplete="off"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-[75vh] overflow-y-auto bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 py-2 custom-scrollbar">
          
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              <div className="animate-spin inline-block w-6 h-6 border-[2.5px] border-current border-t-transparent text-indigo-600 rounded-full mb-3"></div>
              <p>Mencari data...</p>
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Tidak ada hasil yang ditemukan untuk &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>&quot;
            </div>
          ) : (
            <div className="flex flex-col">
              
              {results.orders.length > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Riwayat Transaksi</div>
                  {results.orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelect(`/admin/orders/${order.id}`)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                        <InboxStackIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate font-mono">
                          #{generateDisplayId(order)}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Pelanggan: {order.profiles?.full_name || 'Tanpa Nama'} • Status: <span className="font-medium capitalize">{order.status}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.orders.length > 0 && (results.users.length > 0 || results.products.length > 0) && (
                <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-4"></div>
              )}

              {results.products.length > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5">
                    <TagIcon className="w-3 h-3" /> Produk & Kategori
                  </div>
                  {results.products.map((product) => (
                    <button
                      key={product.product_id}
                      onClick={() => handleSelect(`/admin/products/${product.product_id}/edit`)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <ShoppingBagIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Kategori: <span className="font-medium">{product.brand || 'Uncategorized'}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && results.users.length > 0 && (
                <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-4"></div>
              )}

              {results.users.length > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Pengguna & Akun</div>
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelect(`/admin/users/${user.id}/edit`)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.full_name || 'Tanpa Nama'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          @{user.username || 'unknown'} • {user.email || '-'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}