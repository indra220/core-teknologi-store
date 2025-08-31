import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/nprogress.css";
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import TopLoader from "@/components/TopLoader";
import { Suspense } from "react"; // 1. Impor Suspense

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core Teknologi Store",
  description: "Pusat penjualan laptop dan teknologi terpercaya.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {/* 2. Bungkus TopLoader dengan Suspense */}
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        
        <NotificationProvider>
          <Header />
          <main className="container mx-auto p-4 sm:p-6 lg:px-8">
            {children}
          </main>
        </NotificationProvider>
      </body>
    </html>
  );
}