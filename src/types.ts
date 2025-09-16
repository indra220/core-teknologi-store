// src/types.ts

export type EmailStatus = 'VERIFIED' | 'PENDING_CHANGE';

export interface Laptop {
  id: string;
  name: string;
  brand: string;
  price: number;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  screen_size: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  price: number;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  screen_size: string | null;
  stock: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  product_variants: ProductVariant[];
}

export interface Profile {
  id: string;
  updated_at: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null; // <-- Pastikan baris ini ada
  role: string;
  email: string | null;
  wallet_balance: number;
  email_status: EmailStatus;
  address_detail: string | null;
}

export interface ShippingAddress {
  address_line_1: string;
  admin_area_2: string;
  admin_area_1: string;
  postal_code: string;
  country_code: string;
}

export interface ProductInfo {
  name: string;
  image_url: string | null;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image_url: string | null;
  products: ProductInfo | null;
}

export type OrderStatus = 'Menunggu Konfirmasi' | 'Diproses' | 'Dalam Pengiriman' | 'Selesai' | 'Dibatalkan';

export interface Order {
  id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
  paypal_order_id: string;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
  profiles: { 
    username: string;
    full_name: string | null;
    email: string | null;
  } | null;
  payment_method: 'paypal' | 'wallet';
}