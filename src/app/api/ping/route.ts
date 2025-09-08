// src/app/api/ping/route.ts

import { NextResponse } from 'next/server';

// Jalankan endpoint ini di Edge untuk respons super cepat dan biaya minimal
export const runtime = 'edge';

// Nonaktifkan semua caching untuk endpoint ini
export const revalidate = 0;

export function GET() {
  // Cukup kembalikan respons JSON sederhana
  return NextResponse.json({ status: 'alive' });
}