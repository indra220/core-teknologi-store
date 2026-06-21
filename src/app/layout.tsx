// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/styles/nprogress.css";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { CartProvider } from "@/context/CartContext";
import { Suspense, ReactNode } from "react";
import { PayPalProvider } from "@/context/PayPalProvider";
import StatusNotifier from "@/components/notifications/StatusNotifier";
import { SessionProvider } from "@/context/SessionContext";
import TopLoader from "@/components/TopLoader";

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
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-300">
        <Suspense fallback={null}>
            <TopLoader />
        </Suspense>
        
        <NotificationProvider>
          <Suspense fallback={null}>
            <StatusNotifier />
          </Suspense>
          <PayPalProvider>
            <SessionProvider>
              <CartProvider>
                <Header />
                {/* PERBAIKAN: Mengganti 'container' dengan 'w-full' agar layout merentang penuh ke layar */}
                <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col flex-1">
                  {children}
                </main>
              </CartProvider>
            </SessionProvider>
          </PayPalProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}