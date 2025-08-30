import { ReactNode } from "react";

// Hapus semua impor dan wrapper yang berhubungan dengan PageTransition.
// Layout ini sekarang hanya akan meneruskan children tanpa menambahkan animasi.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}