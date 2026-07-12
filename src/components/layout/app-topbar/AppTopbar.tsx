import Link from "next/link";
import type { MouseEventHandler } from "react";
import { Logo } from "@/components/ui/logo/Logo";
import { cn } from "@/lib/utils/cn";

interface AppTopbarProps {
  children?: React.ReactNode;
  className?: string;
  logoHref?: string;
  onLogoClick?: MouseEventHandler<HTMLAnchorElement>;
}

const BASE_CLASS =
  "flex items-center justify-between border-b border-border px-gutter py-5.5";

export function AppTopbar({
  children,
  className,
  logoHref = "/",
  onLogoClick,
}: AppTopbarProps) {
  return (
    <header className={cn(BASE_CLASS, className)}>
      <Link href={logoHref} {...(onLogoClick ? { onClick: onLogoClick } : {})}>
        <Logo />
      </Link>
      {children && <div className="flex items-center gap-3.5">{children}</div>}
    </header>
  );
}
