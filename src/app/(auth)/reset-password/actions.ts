// src/app/(auth)/reset-password/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { redirect } from "next/navigation";

type FormState = {
  message: string;
  type: 'success' | 'error';
} | null;

const PasswordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter."),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok.",
  path: ["confirmPassword"],
});

export async function updatePassword(prevState: FormState, formData: FormData): Promise<FormState> {
  const validation = PasswordSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return { message: validation.error.issues[0].message, type: 'error' };
  }
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sesi tidak valid atau telah berakhir. Silakan minta link reset baru.", type: 'error' };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { message: "Gagal memperbarui password: " + error.message, type: 'error' };
  }

  await supabase.auth.signOut();

  // --- PERBAIKAN DI SINI ---
  // Tambahkan parameter 'action=clearsession' untuk memberi sinyal ke halaman login
  redirect('/login?message=reset_success&action=clearsession');
}