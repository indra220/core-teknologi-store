// src/app/profile/layout.tsx

// Hapus semua impor dan wrapper yang berhubungan dengan PageTransition.
// Layout ini sekarang hanya akan meneruskan children tanpa menambahkan animasi.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}