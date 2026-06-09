import AppLayout from "@/components/AppLayout";

export default function OperacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
