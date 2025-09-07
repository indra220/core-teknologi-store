// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/nprogress.css";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { CartProvider } from "@/context/CartContext";
import TopLoader from "@/components/TopLoader";
import { Suspense, ReactNode } from "react"; // Impor ReactNode
import { PayPalProvider } from "@/context/PayPalProvider";
import StatusNotifier from "@/components/notifications/StatusNotifier";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Core Teknologi Store",
  description: "Pusat penjualan laptop dan teknologi terpercaya.",
};

// PERBAIKAN: Ubah tipe 'React.Node' menjadi 'ReactNode'
export default function RootLayout({ children }: { children: ReactNode; }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`bg-gray-100 text-gray-900 font-sans`}>
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