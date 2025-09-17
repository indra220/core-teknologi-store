// src/app/(auth)/layout.tsx
import PageTransition from "@/components/PageTransition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition variant="scaleDown">
       <div>
        {children}
       </div>
    </PageTransition>
  );
}