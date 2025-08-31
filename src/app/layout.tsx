import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Hapus impor nprogress.css
import Header from "@/components/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
// Hapus impor PageTransition jika Anda ingin menghapus animasi halaman juga
// Hapus impor TopLoader

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core Teknologi Store",
  description: "Pusat penjualan laptop dan teknologi terpercaya.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {/* Hapus TopLoader dari sini */}
        <NotificationProvider>
          <Header />
          <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Hapus PageTransition jika Anda ingin menghapus animasi halaman */}
            {children}
          </main>
        </NotificationProvider>
      </body>
    </html>
  );
}