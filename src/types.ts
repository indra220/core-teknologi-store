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