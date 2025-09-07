// src/context/PayPalProvider.tsx

'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { ReactNode } from "react";

const payPalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

interface PayPalProviderProps {
  children: ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  if (!payPalClientId) {
    console.error("PayPal Client ID tidak ditemukan. Pastikan Anda sudah menambahkannya di .env.local");
    return <>{children}</>; 
  }

  const initialOptions = {
    // PERBAIKAN: Ubah "client-id" menjadi clientId
    clientId: payPalClientId,
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  );
}