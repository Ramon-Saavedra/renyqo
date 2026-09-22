import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Logo } from "@/components/ui/logo/Logo";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import { dashboardCopy } from "../copy/dashboard";

const ICON_SIZE = 15;
const ICON_STROKE = 1.7;

const BAR_CLASS =
  "sticky top-0 z-40 flex h-app-topbar shrink-0 items-center gap-x-3 border-b border-border bg-background px-3 sm:gap-x-6 lg:px-gutter";

const ACTIONS_CLASS = "ml-auto flex items-center gap-2";
const TOPBAR_ICON_ACTION_CLASS =
  "justify-center rounded-sm px-0 sm:h-11 sm:w-auto sm:rounded-md";
const GHOST_LINK_CLASS = `${buttonClassWithSize("ghost", "icon-sm")} ${TOPBAR_ICON_ACTION_CLASS} text-body sm:gap-2 sm:px-4.5`;
const PRIMARY_LINK_CLASS = `h-8 w-8 ${TOPBAR_ICON_ACTION_CLASS} inline-flex cursor-pointer items-center border border-primary bg-primary text-action font-medium text-primary-foreground hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus sm:gap-2 sm:px-4.5`;

const PROFILE_CLASS = "ml-1 border-l border-border pl-3 sm:pl-4";

export function DashboardTopbar() {
  const { topbar } = dashboardCopy;

  return (
    <header className={BAR_CLASS}>
      <Link href="/provider/dashboard" aria-label="Renyqo">
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
          <AccountMenu variant="full" />
        </div>
      </div>
    </header>
  );
}
