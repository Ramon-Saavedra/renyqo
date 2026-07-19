import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { buttonClass } from "@/components/ui/button/Button";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { passwordRecoveryCopy } from "@/features/auth/copy/password-recovery";

export default function ForgotPasswordPage() {
  return (
    <PageShell className="flex-1">
      <AppTopbar className="mb-section">
        <Link href="/login" className={buttonClass("ghost")}>
          <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
          {passwordRecoveryCopy.backToLogin}
        </Link>
      </AppTopbar>

      <div className="flex flex-1 flex-col justify-center px-gutter">
        <div className="mb-8 mx-auto w-full max-w-md">
          <h1 className="mb-2.5 font-display text-heading-xl font-medium text-foreground">
            {passwordRecoveryCopy.forgot.title}
          </h1>
          <p className="text-lead text-foreground-secondary">
            {passwordRecoveryCopy.forgot.subtitle}
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </PageShell>
  );
}
