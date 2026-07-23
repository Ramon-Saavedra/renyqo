import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

interface ListingsTopbarActionsProps {
  onBackClick?: () => void;
}

export function ListingsTopbarActions({
  onBackClick,
}: ListingsTopbarActionsProps) {
  if (onBackClick) {
    return (
      <button
        type="button"
        onClick={onBackClick}
        className={buttonClass("ghost")}
      >
        <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
        {listingsCopy.topbar.back}
      </button>
    );
  }

  return (
    <Link href={listingsCopy.topbar.backHref} className={buttonClass("ghost")}>
      <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
      {listingsCopy.topbar.back}
    </Link>
  );
}
