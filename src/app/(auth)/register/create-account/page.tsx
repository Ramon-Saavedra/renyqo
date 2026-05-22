import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { InfoPill } from "@/components/ui/info-pill/InfoPill";
import { Stepper } from "@/components/ui/stepper/Stepper";
import { CreateAccountForm } from "@/features/auth/components/CreateAccountForm";
import {
  createAccountCopy,
  createAccountRoleCopy,
} from "@/features/auth/copy/create-account";
import { REGISTER_STEPS } from "@/features/auth/copy/register-flow";
import { ROLE_GLYPHS, resolveRole } from "@/features/auth/utils/role";

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

function ReassureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 text-caption text-foreground-secondary">
      <span className="shrink-0 pt-0.5 text-primary">{icon}</span>
      <span>
        <strong className="block font-medium text-foreground">{title}</strong>
        {description}
      </span>
    </div>
  );
}

export default async function CreateAccountPage({ searchParams }: PageProps) {
  const { role: roleParam } = await searchParams;
  const role = resolveRole(roleParam);
  const roleCopy = createAccountRoleCopy[role];

  return (
    <PageShell>
      <AppTopbar className="mb-section">
        <Link href="/register/account-type" className={buttonClass("ghost")}>
          <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
          {createAccountCopy.back}
        </Link>
      </AppTopbar>

      <div className="flex flex-1 flex-col px-gutter">
        <Stepper steps={REGISTER_STEPS} currentIndex={1} className="mb-7" />

        <div className="grid flex-1 items-start gap-20 lg:grid-cols-2">
          <div>
            <InfoPill withPip className="mb-5">
              {roleCopy.tag}
            </InfoPill>
            <h1 className="mb-3.5 font-display text-display font-medium text-balance text-foreground">
              {roleCopy.title}
            </h1>
            <p className="mb-9 max-w-md text-lead text-foreground-secondary">
              {roleCopy.subtitle}
            </p>

            <div className="grid max-w-sm gap-3.5 border-t border-border pt-7">
              <ReassureItem
                icon={
                  <AppIcon
                    icon={ROLE_GLYPHS[role]}
                    size={14}
                    strokeWidth={1.6}
                    decorative
                  />
                }
                title={roleCopy.reassure[0].title}
                description={roleCopy.reassure[0].description}
              />
              <ReassureItem
                icon={
                  <AppIcon icon={Shield} size={14} strokeWidth={1.6} decorative />
                }
                title={roleCopy.reassure[1].title}
                description={roleCopy.reassure[1].description}
              />
            </div>
          </div>

          <CreateAccountForm idPrefix={role} />
        </div>
      </div>
    </PageShell>
  );
}
