import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";

const IDENTITY_CLASS = "flex items-center gap-2.5 sm:gap-3";

export function AccountIdentitySkeleton() {
  return (
    <span className={IDENTITY_CLASS}>
      <RenyqoSkeleton variant="circle" className="h-7 w-7 sm:h-8 sm:w-8" />
      <RenyqoSkeleton variant="text" className="hidden h-3.5 w-24 md:block" />
    </span>
  );
}

export function SessionPendingTopbarActions() {
  return (
    <span className="flex items-center gap-2">
      <RenyqoSkeleton className="h-9 w-9 rounded-md" />
      <AccountIdentitySkeleton />
    </span>
  );
}
