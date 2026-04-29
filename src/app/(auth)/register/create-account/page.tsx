import Link from "next/link";
import { ArrowLeft, Building, Lock, Shield } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { buttonClass } from "@/components/ui/button/Button";
import { Logo } from "@/components/ui/logo/Logo";
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
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-14 pt-8 pb-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/register/account-type" className={buttonClass("ghost")}>
            <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
            {createAccountCopy.back}
          </Link>
        </div>

        <Stepper steps={REGISTER_STEPS} currentIndex={1} className="mt-10" />

        <div className="mt-8 grid flex-1 items-start gap-20 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-sm border border-border bg-background-subtle px-2.5 py-1.5 font-mono text-meta uppercase text-foreground-tertiary">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
              {roleCopy.tag}
            </span>
            <h1 className="font-display text-display font-medium text-balance text-foreground">
              {roleCopy.title}
            </h1>
            <p className="mt-3.5 max-w-md text-lead text-foreground-secondary">
              {roleCopy.subtitle}
            </p>

            <div className="mt-9 grid max-w-sm gap-3.5 border-t border-border pt-7">
              <ReassureItem
                icon={<PrimaryIcon size={14} strokeWidth={1.6} aria-hidden="true" />}
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
    </main>
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
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span>
        <strong className="block font-medium text-foreground">{title}</strong>
        {description}
      </span>
    </div>
  );
}
