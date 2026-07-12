"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar/Avatar";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Logo } from "@/components/ui/logo/Logo";
import { getCurrentUser } from "@/lib/api/auth";
import type { SafeUser } from "@/lib/api/auth";
import type { AccentId } from "../copy/dashboard";
import { dashboardCopy } from "../copy/dashboard";
import { DashboardSettingsMenu } from "./DashboardSettingsMenu";

interface DashboardTopbarProps {
  accent: AccentId;
  onAccentChange: (accent: AccentId) => void;
}

const ICON_SIZE = 15;
const ICON_STROKE = 1.7;

const BAR_CLASS =
  "mb-4 flex shrink-0 items-center gap-x-3 border-b border-border px-3 py-3.5 sm:mb-0 sm:gap-x-6 sm:py-4 lg:px-gutter";

const ACTIONS_CLASS = "ml-auto flex items-center gap-2";
const TOPBAR_ICON_ACTION_CLASS =
  "h-6.5 w-6.5 justify-center rounded-sm px-0 sm:h-11 sm:w-auto sm:rounded-md";
const GHOST_LINK_CLASS = `${buttonClass("ghost")} ${TOPBAR_ICON_ACTION_CLASS} border border-border-strong text-body sm:gap-2 sm:px-4.5`;
const PRIMARY_LINK_CLASS = `${TOPBAR_ICON_ACTION_CLASS} inline-flex cursor-pointer items-center border border-primary bg-primary text-action font-medium text-primary-foreground transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus sm:gap-2 sm:px-4.5`;

const PROFILE_CLASS = "ml-1 border-l border-border pl-3 sm:pl-4";
const PROFILE_TRIGGER_CLASS =
  "flex h-6.5 max-w-48 cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent p-0 text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus sm:h-11 sm:max-w-64 sm:gap-3";
const PROFILE_AVATAR_CLASS = "h-7 w-7 sm:h-8 sm:w-8";
const PROFILE_META_CLASS = "hidden max-w-36 flex-col leading-tight 2xl:flex";
const PROFILE_NAME_CLASS = "truncate text-caption font-medium text-foreground";
const PROFILE_CO_CLASS = "truncate text-caption text-foreground-tertiary";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase() || "U";
}

function toTitleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function DashboardTopbar({
  accent,
  onAccentChange,
}: DashboardTopbarProps) {
  const { topbar, profile } = dashboardCopy;
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const profileName = toTitleCase(user?.name ?? profile.name);
  const profileEmail = user?.email ?? null;
  const profileCompany = user?.companyName ?? null;
  const profileInitials = useMemo(
    () => getInitials(profileName),
    [profileName],
  );

  return (
    <header className={BAR_CLASS}>
      <Link href="/" aria-label="Renyqo">
        <Logo />
      </Link>

      <div className={ACTIONS_CLASS}>
        <Link
          href={topbar.objectsHref}
          aria-label={topbar.objects}
          className={GHOST_LINK_CLASS}
        >
          <AppIcon
            icon={LayoutGrid}
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            decorative
          />
          <span className="hidden lg:inline">{topbar.objects}</span>
        </Link>
        <Link
          href={topbar.newListingHref}
          aria-label={topbar.newListing}
          className={PRIMARY_LINK_CLASS}
        >
          <AppIcon
            icon={Plus}
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            decorative
          />
          <span className="hidden sm:inline">{topbar.newListing}</span>
        </Link>

        <div className={PROFILE_CLASS}>
          <DashboardSettingsMenu
            accent={accent}
            onAccentChange={onAccentChange}
            userEmail={profileEmail}
            triggerClassName={PROFILE_TRIGGER_CLASS}
            trigger={
              <>
                <Avatar
                  initials={profileInitials}
                  label={profileName}
                  className={PROFILE_AVATAR_CLASS}
                />
                <span className={PROFILE_META_CLASS}>
                  <span className={PROFILE_NAME_CLASS}>{profileName}</span>
                  {profileCompany && (
                    <span className={PROFILE_CO_CLASS}>{profileCompany}</span>
                  )}
                </span>
              </>
            }
          />
        </div>
      </div>
    </header>
  );
}
