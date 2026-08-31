"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar/Avatar";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { cn } from "@/lib/utils/cn";
import ThemeToggle from "@/components/ui/theme-toggle/ThemeToggle";
import { invalidateApplicantProfile } from "@/features/applicant/profile/hooks/useApplicantProfileStatus";
import { ProfileMenuLink } from "@/features/applicant/profile/components/ProfileMenuLink";
import { logout } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  useCurrentUser,
} from "@/lib/api/use-current-user";
import { getInitials, toTitleCase } from "@/lib/utils/user-name";
import { isApplicantRole } from "@/features/auth/utils/role";
import { userMenuCopy } from "./copy/user-menu";

interface AccountMenuProps {
  variant?: "compact" | "full";
  className?: string;
}

const TRIGGER_COMPACT_CLASS =
  "flex cursor-pointer items-center rounded-md border-0 bg-transparent p-0 hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";
const TRIGGER_FULL_CLASS =
  "flex h-6.5 max-w-48 cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent p-0 text-left hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus sm:h-11 sm:max-w-64 sm:gap-3";
const AVATAR_FULL_CLASS = "h-7 w-7 sm:h-8 sm:w-8";
const META_CLASS = "hidden max-w-36 flex-col leading-tight 2xl:flex";
const NAME_CLASS = "truncate text-caption font-medium text-foreground";
const COMPANY_CLASS = "truncate text-caption text-foreground-tertiary";
const PANEL_CLASS = "w-72 p-3";
const PANEL_HEAD_CLASS = "mb-3 flex items-center justify-between gap-3";
const PANEL_TITLE_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const THEME_ROW_CLASS =
  "flex items-center justify-between gap-3 rounded-md border border-border bg-background-muted p-3";
const THEME_LABEL_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const THEME_TOGGLE_CLASS =
  "inline-flex items-center gap-2 rounded-sm border border-border-strong bg-background px-3 py-2 text-caption font-medium text-foreground-secondary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";
const EMAIL_CLASS =
  "mt-3 truncate border-t border-border pt-3 text-caption text-foreground-tertiary";
const LOGOUT_BUTTON_CLASS = cn(
  buttonClassWithSize("danger", "sm"),
  "mt-3 w-full text-left",
);

export function AccountMenu({
  variant = "compact",
  className,
}: AccountMenuProps) {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError(null);
    setLoggingOut(true);
    try {
      await logout();
      invalidateCurrentUser();
      invalidateApplicantProfile();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
      setLogoutError(userMenuCopy.logoutError);
    }
  }

  const name = user ? toTitleCase(user.name) : "";
  const initials = getInitials(name);
  const company = user?.companyName ?? null;
  const isApplicant = isApplicantRole(user?.role);
  const isFull = variant === "full";
  const avatarClass = isFull ? AVATAR_FULL_CLASS : undefined;

  return (
    <PopoverPanel
      ariaLabel={userMenuCopy.settings}
      {...(className ? { className } : {})}
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          className={isFull ? TRIGGER_FULL_CLASS : TRIGGER_COMPACT_CLASS}
        >
          {loading ? (
            <RenyqoSkeleton variant="circle" width={32} height={32} />
          ) : (
            <Avatar
              initials={initials}
              label={name || userMenuCopy.fallbackLabel}
              {...(avatarClass ? { className: avatarClass } : {})}
            />
          )}
          {isFull && name && (
            <span className={META_CLASS}>
              <span className={NAME_CLASS}>{name}</span>
              {company && <span className={COMPANY_CLASS}>{company}</span>}
            </span>
          )}
        </button>
      )}
    >
      <div className={PANEL_HEAD_CLASS}>
        <span className={PANEL_TITLE_CLASS}>{userMenuCopy.settings}</span>
      </div>

      <div className={THEME_ROW_CLASS}>
        <span className={THEME_LABEL_CLASS}>{userMenuCopy.appearance}</span>
        <ThemeToggle showLabel iconSize={14} className={THEME_TOGGLE_CLASS} />
      </div>

      {isApplicant && <ProfileMenuLink />}

      {logoutError ? (
        <FormAlert variant="error" message={logoutError} className="mt-3" />
      ) : null}

      <button
        type="button"
        className={LOGOUT_BUTTON_CLASS}
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <AppIcon icon={LogOut} size={14} decorative />
        <span>
          {loggingOut ? userMenuCopy.loggingOut : userMenuCopy.logout}
        </span>
      </button>

      {user?.email && <p className={EMAIL_CLASS}>{user.email}</p>}
    </PopoverPanel>
  );
}
