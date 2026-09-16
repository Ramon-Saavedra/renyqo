import { PageShell } from "@/components/layout/page-shell/PageShell";

export default function StandardAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
