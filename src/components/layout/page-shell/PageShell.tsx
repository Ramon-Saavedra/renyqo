import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

const MAIN_CLASS = "flex min-h-screen flex-col bg-background text-foreground";
const CONTAINER_CLASS = "mx-auto flex w-full sm:max-w-page flex-col pb-section";

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={MAIN_CLASS}>
      <div className={cn(CONTAINER_CLASS, className)}>
        {children}
      </div>
    </main>
  );
}
