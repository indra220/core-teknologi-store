// src/context/CartContext.tsx

'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Laptop } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface CartItem extends Laptop { quantity: number; }
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Laptop, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  // PERBAIKAN: Ubah tipe clearCart menjadi Promise<void>
  clearCart: () => Promise<void>;
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
    const { data: cartData, error } = await supabase
      .from('cart_items')
      .select('quantity, laptops (*)')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
    } else if (cartData) {
      const formattedCart = cartData
        .filter(item => item.laptops)
        .map(item => ({
          ...(item.laptops as unknown as Laptop),
          quantity: item.quantity,
        }));
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

  const addToCart = async (product: Laptop, quantity: number) => {
    if (!user) return;
    const { error } = await supabase.from('cart_items').upsert({
      user_id: user.id,
      product_id: product.id,
      quantity: (cartItems.find(item => item.id === product.id)?.quantity || 0) + quantity
    }, { onConflict: 'user_id, product_id' });
    
    if (!error) {
      await fetchCartItems(user.id);
      showNotification(`${quantity} "${product.name}" ditambahkan!`, 'success');
    }
  };
  
  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const { error } = await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: productId });
    if (!error) {
      await fetchCartItems(user.id);
      showNotification('Produk dihapus dari keranjang.', 'info');
    }
  };
  
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }
    const { error } = await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, product_id: productId });
    if (!error) {
      await fetchCartItems(user.id);
    }
  };
  
  // FUNGSI YANG DISEMPURNAKAN
  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    // Hapus semua item dari database untuk user yang sedang login
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (!error) {
      // Jika berhasil, kosongkan state lokal
      setCartItems([]);
    } else {
      console.error("Gagal membersihkan keranjang di database:", error);
      showNotification("Gagal membersihkan keranjang.", "error");
    }
  };
  
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
}