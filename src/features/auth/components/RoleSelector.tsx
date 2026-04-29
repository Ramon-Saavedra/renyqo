"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Search, type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Button } from "@/components/ui/button/Button";
import { RoleCard } from "./RoleCard";
import { accountTypeCopy, type Role } from "../copy/account-type";

const ROLE_GLYPHS: Record<Role, LucideIcon> = {
  applicant: Search,
  provider: Building2,
};

const ROLE_KEYS: readonly Role[] = ["applicant", "provider"];

export function RoleSelector() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("applicant");

  const handleSubmit = () => {
    router.push(`/register?role=${role}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-7">
      <div
        role="radiogroup"
        aria-label={accountTypeCopy.title}
        className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2"
      >
        {ROLE_KEYS.map((key, position) => {
          const data = accountTypeCopy.roles[key];
          return (
            <RoleCard
              key={key}
              kicker={data.kicker}
              title={data.title}
              description={data.description}
              points={data.points}
              benefits={data.benefits}
              benefitsDelay={position * 3000}
              glyph={ROLE_GLYPHS[key]}
              active={role === key}
              onSelect={() => setRole(key)}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-caption text-foreground-secondary">
        <span>
          {accountTypeCopy.alreadyAccount}{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-hover"
          >
            {accountTypeCopy.signIn}
          </Link>
        </span>
        <Button variant="primary" onClick={handleSubmit}>
          {accountTypeCopy.next}
          <AppIcon icon={ArrowRight} size={14} strokeWidth={1.8} decorative />
        </Button>
      </div>
    </div>
  );
}
