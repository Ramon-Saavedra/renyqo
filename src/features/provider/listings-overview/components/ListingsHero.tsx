import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

const WRAPPER_CLASS =
  "mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-5";

const TEXT_BLOCK_CLASS = "max-w-xl";

const TITLE_CLASS =
  "mb-2 font-display text-heading-xl font-medium text-foreground";

export function ListingsHero() {
  return (
    <div className={WRAPPER_CLASS}>
      <div className={TEXT_BLOCK_CLASS}>
        <h1 className={TITLE_CLASS}>{listingsCopy.hero.title}</h1>
      </div>
    </div>
  );
}

export function NewListingAction() {
  return (
    <Link href={listingsCopy.hero.newHref} className={buttonClass("primary")}>
      <AppIcon icon={Plus} size={15} strokeWidth={1.8} decorative />
      {listingsCopy.hero.newLabel}
    </Link>
  );
}
