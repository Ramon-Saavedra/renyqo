import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { loginCopy } from "@/features/auth/copy/login";

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset } = await searchParams;

  return (
    <PageShell className="flex-1">
      <AppTopbar className="mb-section">
        <Link href="/register/account-type" className={buttonClass("ghost")}>
          {loginCopy.register}
          <AppIcon icon={ArrowRight} size={14} strokeWidth={1.6} decorative />
        </Link>
      </AppTopbar>

      <div className="flex flex-1 flex-col justify-center px-gutter">
        <div className="mb-8 mx-auto w-full max-w-md">
          <h1 className="mb-2.5 font-display text-heading-xl font-medium text-foreground">
            {loginCopy.title}
          </h1>
          <p className="text-lead text-foreground-secondary">
            {loginCopy.subtitle}
          </p>
        </div>
        <LoginForm
          initialSuccessMessage={
            reset === "success" ? loginCopy.resetSuccess : undefined
          }
        />
      </div>
    </PageShell>
  );
}
