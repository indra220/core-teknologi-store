// src/app/(auth)/layout.tsx
import PageTransition from "@/components/PageTransition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition variant="scaleDown">
       <div className="w-full flex items-center justify-center min-h-[calc(100vh-100px)]">
        {children}
       </div>
    </PageTransition>
  );
}