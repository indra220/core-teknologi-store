import PageTransition from "@/components/PageTransition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition variant="scaleDown">
      {children}
    </PageTransition>
  );
}