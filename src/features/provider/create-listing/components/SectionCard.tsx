import { cn } from "@/lib/utils/cn";

interface SectionCardProps {
  id: string;
  num: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const BASE_CLASS = "rounded-md border border-border bg-background px-7 py-6.5";

export function SectionCard({
  id,
  num,
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section id={id} className={cn(BASE_CLASS, className)}>
      <header className="mb-5.5">
        <div className="mb-2 font-mono text-meta uppercase text-foreground-tertiary">
          {num}
        </div>
        <h2 className="mb-1.5 font-display text-heading-md font-medium text-foreground">
          {title}
        </h2>
        <p className="max-w-md text-caption leading-normal text-foreground-secondary">
          {description}
        </p>
      </header>
      <div className="flex flex-col gap-4.5">{children}</div>
    </section>
  );
}
