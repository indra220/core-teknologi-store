// src/context/CartContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Product, ProductVariant } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  quantity: number;
}

type CartDataFromServer = {
  quantity: number;
  product_variants: (ProductVariant & { products: Product | null }) | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearClientCart: () => void; // <-- TAMBAHKAN FUNGSI BARU INI
  cartCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const supabase = createClient();

  const fetchCartItems = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        product_variants (
          *,
          products (
            id, name, brand, image_url
          )
        )
      `)
      .eq('user_id', userId)
      .returns<CartDataFromServer[]>();

    if (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
    } else if (data) {
      const formattedCart = data
        .filter(item => item.product_variants && item.product_variants.products)
        .map(item => {
          const variant = item.product_variants!;
          const product = variant.products!;
          return {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            brand: product.brand,
            price: variant.price,
            imageUrl: product.image_url,
            processor: variant.processor,
            ram: variant.ram,
            storage: variant.storage,
            quantity: item.quantity,
          };
        });
      setCartItems(formattedCart);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      if (currentUser) {
        fetchCartItems(currentUser.id);
      } else {
        setCartItems([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchCartItems, supabase]);
  
  const addToCart = async (product: Product, variant: ProductVariant, quantity: number) => {
    if (!user) return;
    const existingItem = cartItems.find(item => item.variantId === variant.id);
    const newQuantity = (existingItem?.quantity || 0) + quantity;

    if(newQuantity > variant.stock) {
        showNotification(`Stok untuk varian ini tidak mencukupi (tersisa ${variant.stock}).`, 'error');
        return;
    }
    showNotification(`${quantity} "${product.name}" ditambahkan!`, 'success');

    const { error } = await supabase.from('cart_items').upsert({
      user_id: user.id,
      variant_id: variant.id, 
      quantity: newQuantity
    }, { onConflict: 'user_id, variant_id' });

    if (error) {
      showNotification("Gagal menambahkan produk.", "error");
    } else {
        await fetchCartItems(user.id);
    }
  };
  
  const removeFromCart = async (variantId: string) => {
    if (!user) return;
    setCartItems(prev => prev.filter(item => item.variantId !== variantId));
    const { error } = await supabase.from('cart_items').delete().match({ user_id: user.id, variant_id: variantId });
    if (error) {
      showNotification("Gagal menghapus produk.", "error");
      await fetchCartItems(user.id);
    } else {
      showNotification('Produk dihapus dari keranjang.', 'info');
    }
  };
  
  const updateQuantity = async (variantId: string, quantity: number) => {
    if (!user) return;
    if (quantity < 1) {
      await removeFromCart(variantId);
      return;
    }
    setCartItems(prev => prev.map(item => item.variantId === variantId ? { ...item, quantity } : item));
    const { error } = await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, variant_id: variantId });
    if (error) {
       showNotification("Gagal memperbarui kuantitas.", "error");
       await fetchCartItems(user.id);
    }
  };
  
  const clearCart = async () => {
    if (!user) return;
    setCartItems([]);
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) {
      showNotification("Gagal membersihkan keranjang.", "error");
      await fetchCartItems(user.id);
    }
  };

  // <-- IMPLEMENTASI FUNGSI BARU
  const clearClientCart = () => {
    setCartItems([]);
  };
  
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, clearClientCart, cartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
}