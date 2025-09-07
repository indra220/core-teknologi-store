// src/app/auth/actions.ts

'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  // PERBAIKAN: Tambahkan parameter ?message=logout_success saat redirect
  redirect('/login?message=logout_success');
}