export interface Laptop {
  id: string; name: string; brand: string; price: number;
  processor: string | null; ram: string | null; storage: string | null;
  screen_size: string | null; image_url: string | null;
  description: string | null; created_at: string;
}

// Tambahkan atau perbarui interface Profile
export interface Profile {
  id: string;
  updated_at: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}