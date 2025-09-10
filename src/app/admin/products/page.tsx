// src/app/admin/products/page.tsx
import AdminProductList from "../ProductList";

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight sm:text-4xl">Manajemen Produk</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Tambah, edit, atau hapus produk di toko Anda.</p>
      </header>
      <AdminProductList />
    </div>
  );
}