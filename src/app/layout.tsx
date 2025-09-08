// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/styles/nprogress.css";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { CartProvider } from "@/context/CartContext";
import TopLoader from "@/components/TopLoader";
import { Suspense, ReactNode } from "react";
import { PayPalProvider } from "@/context/PayPalProvider";
import StatusNotifier from "@/components/notifications/StatusNotifier";
// HAPUS: import { Providers } from "./Providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta-sans',
});

export const metadata: Metadata = {
  title: "Core Teknologi Store",
  description: "Pusat penjualan laptop dan teknologi terpercaya.",
};

export default function RootLayout({ children }: { children: ReactNode; }) {
  // HAPUS: suppressHydrationWarning
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className={`font-sans`}>
        {/* HAPUS: Wrapper <Providers> */}
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        
        <NotificationProvider>
          <Suspense fallback={null}>
            <StatusNotifier />
          </Suspense>
          <PayPalProvider>
            <CartProvider>
              <Header />
              <main className="container mx-auto p-4 sm:p-6 lg:px-8">
                {children}
              </main>
            </CartProvider>
          </PayPalProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}