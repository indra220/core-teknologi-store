import PageTransition from "@/components/PageTransition";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition variant="fadeInUp">
      {children}
    </PageTransition>
  );
}