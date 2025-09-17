// src/app/forgot-password/actions.ts
'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type FormState = {
  message: string;
  type: 'success' | 'error';
} | null;

const EmailSchema = z.string().email({ message: "Format email tidak valid." });

export async function requestPasswordReset(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string;

  const validation = EmailSchema.safeParse(email);
  if (!validation.success) {
    // --- PERBAIKAN DI SINI ---
    // Akses pesan error melalui validation.error.issues
    return { message: validation.error.issues[0].message, type: 'error' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    console.error("Password Reset Error:", error.message);
    return { 
      message: "Jika email Anda terdaftar, Anda akan menerima link untuk reset password.",
      type: 'success'
    };
  }

  return {
    message: "Jika email Anda terdaftar, Anda akan menerima link untuk reset password.",
    type: 'success'
  };
}