import { Logo } from "@/components/ui/logo/Logo";

interface AppTopbarProps {
  children?: React.ReactNode;
  className?: string;
}

const BASE_CLASS =
  "flex items-center justify-between border-b border-border px-14 py-5.5";

export function AppTopbar({ children, className }: AppTopbarProps) {
  return (
    <header className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}>
      <Logo />
      {children && <div className="flex items-center gap-3.5">{children}</div>}
    </header>
  );
}
