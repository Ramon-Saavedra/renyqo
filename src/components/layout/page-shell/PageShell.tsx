interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

const MAIN_CLASS = "flex min-h-screen flex-col bg-background text-foreground";
const CONTAINER_CLASS = "mx-auto flex w-full max-w-page flex-col pb-section";

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={MAIN_CLASS}>
      <div
        className={
          className ? `${CONTAINER_CLASS} ${className}` : CONTAINER_CLASS
        }
      >
        {children}
      </div>
    </main>
  );
}
