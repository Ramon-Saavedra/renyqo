import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

export function ListingsTopbarActions() {
  return (
    <Link href={listingsCopy.topbar.backHref} className={buttonClass("ghost")}>
      <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
      {listingsCopy.topbar.back}
    </Link>
  );
}
