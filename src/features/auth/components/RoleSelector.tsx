"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowRight, Building2, Search, type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { buttonClass } from "@/components/ui/button/Button";
import { RoleCard } from "./RoleCard";
import { accountTypeCopy, type Role } from "../copy/account-type";

const ROLE_GLYPHS: Record<Role, LucideIcon> = {
  applicant: Search,
  provider: Building2,
};

const ROLE_KEYS: readonly Role[] = ["applicant", "provider"];

interface RoleSelectorProps {
  initialRole?: Role;
  ariaLabelledBy?: string;
}

export function RoleSelector({
  initialRole = "applicant",
  ariaLabelledBy,
}: RoleSelectorProps) {
  const [role, setRole] = useState<Role>(initialRole);
  const roleRefs = useRef<Partial<Record<Role, HTMLDivElement | null>>>({});

  function handleRoleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    position: number,
  ) {
    let nextPosition: number | undefined;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextPosition = (position + 1) % ROLE_KEYS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextPosition = (position - 1 + ROLE_KEYS.length) % ROLE_KEYS.length;
        break;
      case "Home":
        nextPosition = 0;
        break;
      case "End":
        nextPosition = ROLE_KEYS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextRole = ROLE_KEYS[nextPosition];
    if (!nextRole) return;
    setRole(nextRole);
    roleRefs.current[nextRole]?.focus();
  }

  return (
    <div className="flex flex-1 flex-col gap-7">
      <div
        role="radiogroup"
        aria-label={ariaLabelledBy ? undefined : accountTypeCopy.roleGroupLabel}
        aria-labelledby={ariaLabelledBy}
        className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2"
      >
        {ROLE_KEYS.map((key, position) => {
          const data = accountTypeCopy.roles[key];
          return (
            <RoleCard
              key={key}
              id={`${key}-role-option`}
              kicker={data.kicker}
              title={data.title}
              description={data.description}
              points={data.points}
              benefits={data.benefits}
              benefitsDelay={position * 3000}
              glyph={ROLE_GLYPHS[key]}
              active={role === key}
              onSelect={() => setRole(key)}
              onKeyDown={(event) => handleRoleKeyDown(event, position)}
              ref={(element) => {
                roleRefs.current[key] = element;
              }}
              tabIndex={role === key ? 0 : -1}
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
        <Link
          href={`/register/create-account?role=${role}`}
          className={buttonClass("primary")}
        >
          {accountTypeCopy.next}
          <AppIcon icon={ArrowRight} size={14} strokeWidth={1.8} decorative />
        </Link>
      </div>
    </div>
  );
}
