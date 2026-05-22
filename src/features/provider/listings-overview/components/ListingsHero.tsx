import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

const WRAPPER_CLASS =
  "mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-5";

const TEXT_BLOCK_CLASS = "max-w-xl";

const KICKER_CLASS =
  "mb-3 font-mono text-meta uppercase text-foreground-tertiary";

const TITLE_CLASS =
  "mb-2 font-display text-heading-xl font-normal text-foreground-secondary";

const LEAD_CLASS = "text-lead text-foreground-secondary";

const ACTIONS_CLASS = "flex flex-wrap items-center gap-2.5";

export function ListingsHero() {
  return (
    <div className={WRAPPER_CLASS}>
      <div className={TEXT_BLOCK_CLASS}>
        <div className={KICKER_CLASS}>{listingsCopy.hero.kicker}</div>
        <h1 className={TITLE_CLASS}>{listingsCopy.hero.title}</h1>
        <p className={LEAD_CLASS}>{listingsCopy.hero.lead}</p>
      </div>
      <div className={ACTIONS_CLASS}>
        <Link
          href={listingsCopy.hero.newHref}
          className={buttonClass("primary")}
        >
          <AppIcon icon={Plus} size={15} strokeWidth={1.8} decorative />
          {listingsCopy.hero.newLabel}
        </Link>
      </div>
    </div>
  );
}
