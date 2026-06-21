// src/app/admin/products/page.tsx
import { createClient } from "@/lib/supabase/server";
import AdminProductList from "../ProductList";

export const revalidate = 0; // Memastikan data sentiasa segar (tidak di-cache secara statik)

export default async function AdminProductsPage() {
  const supabase = await createClient();
  
  // Mengambil data produk berserta relasinya (JOIN) ke tabel laptops dan product_variants
  const { data: rawProducts, error } = await supabase
    .from('products')
    .select(`
      id,
      price,
      created_at,
      laptops ( name, image_url, brand ),
      product_variants ( stock )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Ralat memuatkan produk:", error);
  }

  // Format data raw dari Supabase agar sesuai dengan props 'Product' di ProductList.tsx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedProducts = rawProducts?.map((p: any) => {
    // Bergantung pada aturan Supabase anda, 'laptops' boleh jadi array atau objek tunggal
    const laptopDetail = Array.isArray(p.laptops) ? p.laptops[0] : p.laptops;
    
    // Hitung jumlah keseluruhan stok daripada semua varian yang ada
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalStock = p.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0;

    return {
      id: p.id,
      name: laptopDetail?.name || 'Produk Tanpa Nama',
      price: p.price,
      stock: totalStock,
      category: laptopDetail?.brand || 'Uncategorized', // Menggunakan brand sebagai kategori untuk paparan
      image_url: laptopDetail?.image_url || null,
    };
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Produk</h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400">Tambah, edit, atau hapus produk di katalog toko Anda.</p>
      </header>
      
      {/* Menyalurkan data yang sudah diformat ke komponen Client */}
      <AdminProductList initialProducts={formattedProducts} />
    </div>
  );
}