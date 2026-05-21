import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { withBrand } from "@/components/ui/brand/BrandName";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Stepper } from "@/components/ui/stepper/Stepper";
import { RoleSelector } from "@/features/auth/components/RoleSelector";
import { accountTypeCopy } from "@/features/auth/copy/account-type";
import { REGISTER_STEPS } from "@/features/auth/copy/register-flow";

export default function AccountTypePage() {
  return (
    <PageShell>
      <AppTopbar className="mb-section">
        <Link href="/register" className={buttonClass("ghost")}>
          <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
          {accountTypeCopy.back}
        </Link>
      </AppTopbar>

      <div className="mx-auto flex w-content flex-1 flex-col">
        <Stepper steps={REGISTER_STEPS} currentIndex={0} className="mb-7" />

        <div className="mb-9 flex max-w-3xl flex-col gap-3">
          <h1 className="font-display text-display font-medium text-balance text-foreground">
            {withBrand(accountTypeCopy.title)}
          </h1>
          <p className="max-w-xl text-lead text-foreground-secondary">
            {accountTypeCopy.subtitle}
          </p>
        </div>

        <RoleSelector />
      </div>
    </PageShell>
  );
}
