import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface DetailCardProps {
  title: string;
  children: ReactNode;
  className?: string | undefined;
}

const CARD_CLASS =
  "rounded-md border border-border bg-background-subtle px-5.5 py-5";
const TITLE_CLASS =
  "mb-3.5 font-display text-action font-medium text-foreground";

export function DetailCard({ title, children, className }: DetailCardProps) {
  return (
    <section className={cn(CARD_CLASS, className)}>
      <h2 className={TITLE_CLASS}>{title}</h2>
      {children}
    </section>
  );
}
