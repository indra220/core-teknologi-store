// src/app/login/layout.tsx

// Hapus semua impor dan wrapper yang berhubungan dengan PageTransition.
// Layout ini sekarang hanya akan meneruskan children tanpa menambahkan animasi.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}