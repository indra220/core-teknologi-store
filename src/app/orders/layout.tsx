// src/app/orders/layout.tsx
import PageTransition from "@/components/PageTransition";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition variant="fadeInUp">
      {children}
    </PageTransition>
  );
}