// src/app/api/search/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Product } from '@/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Query is too short' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, image_url')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(5)
    .returns<Product[]>();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}