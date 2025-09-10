// src/app/admin/products/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";
import type { Product } from "@/types";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_variants ( * )
    `)
    .eq('id', params.id)
    .single<Product>();

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">Edit Produk</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Anda sedang mengelola varian dan stok untuk: <span className="font-semibold">{product.name}</span>
        </p>
      </header>
      <EditProductForm product={product} />
    </div>
  );
}