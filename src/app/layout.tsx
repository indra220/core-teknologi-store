// src/app/layout.tsx

// PERBAIKAN: Hapus 'Metadata' dari baris impor di bawah ini
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/nprogress.css";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { CartProvider } from "@/context/CartContext";
import TopLoader from "@/components/TopLoader";
import { Suspense } from "react";
import { PayPalProvider } from "@/context/PayPalProvider";
import StatusNotifier from "@/components/notifications/StatusNotifier";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core Teknologi Store",
  description: "Pusat penjualan laptop dan teknologi terpercaya.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 text-gray-900`}>
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