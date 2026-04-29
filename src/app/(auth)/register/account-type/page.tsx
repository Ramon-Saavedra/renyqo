import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { withBrand } from "@/components/ui/brand/BrandName";
import { buttonClass } from "@/components/ui/button/Button";
import { Logo } from "@/components/ui/logo/Logo";
import { Stepper } from "@/components/ui/stepper/Stepper";
import { RoleSelector } from "@/features/auth/components/RoleSelector";
import { accountTypeCopy } from "@/features/auth/copy/account-type";

export default function AccountTypePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-14 pt-8 pb-12">
        <div className="mb-12 flex items-center justify-between">
          <Logo />
          <Link href="/register" className={buttonClass("ghost")}>
            <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
            {accountTypeCopy.back}
          </Link>
        </div>

        <Stepper
          steps={accountTypeCopy.steps}
          currentIndex={0}
          className="mb-7"
        />

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
    </main>
  );
}
