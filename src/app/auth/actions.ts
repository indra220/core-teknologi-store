// src/app/auth/actions.ts

'use server';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // PERBAIKAN: Tambahkan parameter ?message=logout_success saat redirect
  redirect('/login?message=logout_success');
}