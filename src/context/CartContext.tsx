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

    const previousCart = [...cartItems];
    
    const existingItem = cartItems.find(item => item.id === product.id);
    const newQuantity = (existingItem?.quantity || 0) + quantity;
    
    let newCartItems: CartItem[];
    if (existingItem) {
      newCartItems = cartItems.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
    } else {
      newCartItems = [...cartItems, { ...product, quantity: newQuantity }];
    }
    
    // 1. Langsung update UI (Optimistic Update)
    setCartItems(newCartItems);
    showNotification(`${quantity} "${product.name}" ditambahkan!`, 'success');

    // 2. Lakukan permintaan ke database
    const { error } = await supabase.from('cart_items').upsert({
      user_id: user.id,
      product_id: product.id,
      quantity: newQuantity
    }, { onConflict: 'user_id, product_id' });

    // 3. Jika gagal, kembalikan state UI dan tampilkan error
    if (error) {
      showNotification("Gagal menambahkan produk.", "error");
      setCartItems(previousCart);
    }
  };
  
  const removeFromCart = async (productId: string) => {
    if (!user) return;
    
    const previousCart = [...cartItems];
    const newCartItems = cartItems.filter(item => item.id !== productId);

    // Optimistic Update
    setCartItems(newCartItems);
    showNotification('Produk dihapus dari keranjang.', 'info');

    const { error } = await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: productId });
    
    if (error) {
       showNotification("Gagal menghapus produk.", "error");
       setCartItems(previousCart);
    }
  };
  
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }

    const previousCart = [...cartItems];
    const newCartItems = cartItems.map(item => item.id === productId ? { ...item, quantity: quantity } : item);

    // Optimistic Update
    setCartItems(newCartItems);
    
    const { error } = await supabase.from('cart_items').update({ quantity }).match({ user_id: user.id, product_id: productId });
    
    if (error) {
       showNotification("Gagal memperbarui kuantitas.", "error");
       setCartItems(previousCart);
    }
  };
  
  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (!error) {
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