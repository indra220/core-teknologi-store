// src/types.ts

// Tipe data lama (bisa dihapus jika tidak ada halaman lain yang masih menggunakannya)
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

// --- TIPE DATA BARU UNTUK PRODUK & VARIAN ---

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
  // Relasi untuk menyertakan semua varian dari produk ini
  product_variants: ProductVariant[];
}


export interface Profile {
  id: string;
  updated_at: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string | null;
}

export interface ShippingAddress {
  address_line_1: string;
  admin_area_2: string; // City
  admin_area_1: string; // State/Province
  postal_code: string;
  country_code: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image_url: string;
  laptops: Laptop; // Untuk relasi data
}

export interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  paypal_order_id: string;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
  profiles: { username: string } | null;
}