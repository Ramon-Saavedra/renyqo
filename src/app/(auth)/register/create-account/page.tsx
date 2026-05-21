import Link from "next/link";
import { ArrowLeft, Building, Lock, Shield } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Stepper } from "@/components/ui/stepper/Stepper";
import { CreateAccountForm } from "@/features/auth/components/CreateAccountForm";
import { type Role } from "@/features/auth/copy/account-type";
import {
  createAccountCopy,
  createAccountRoleCopy,
} from "@/features/auth/copy/create-account";
import { REGISTER_STEPS } from "@/features/auth/copy/register-flow";

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

const ROLE_GLYPHS = {
  applicant: Lock,
  provider: Building,
} as const;

function resolveRole(value: string | undefined): Role {
  return value === "provider" ? "provider" : "applicant";
}

export default async function CreateAccountPage({ searchParams }: PageProps) {
  const { role: roleParam } = await searchParams;
  const role = resolveRole(roleParam);
  const roleCopy = createAccountRoleCopy[role];
  const PrimaryIcon = ROLE_GLYPHS[role];

  return (
    <PageShell>
      <AppTopbar className="mb-section">
        <Link href="/register/account-type" className={buttonClass("ghost")}>
          <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
          {createAccountCopy.back}
        </Link>
      </AppTopbar>

      <div className="flex flex-1 flex-col px-14">
        <Stepper steps={REGISTER_STEPS} currentIndex={1} className="mb-7" />

        <div className="grid flex-1 items-start gap-20 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-sm border border-border bg-background-subtle px-2.5 py-1.5 font-mono text-meta uppercase text-foreground-tertiary">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
              {roleCopy.tag}
            </span>
            <h1 className="mb-3.5 font-display text-display font-medium text-balance text-foreground">
              {roleCopy.title}
            </h1>
            <p className="mb-9 max-w-md text-lead text-foreground-secondary">
              {roleCopy.subtitle}
            </p>

            <div className="grid max-w-sm gap-3.5 border-t border-border pt-7">
              <ReassureItem
                icon={
                  <PrimaryIcon size={14} strokeWidth={1.6} aria-hidden="true" />
                }
                title={roleCopy.reassure[0].title}
                description={roleCopy.reassure[0].description}
              />
              <ReassureItem
                icon={<Shield size={14} strokeWidth={1.6} aria-hidden="true" />}
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
