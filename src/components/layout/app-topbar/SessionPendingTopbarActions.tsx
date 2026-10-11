import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";

const SKELETON_CLASS = "flex items-center gap-3.5";

export function SessionPendingTopbarActions() {
  return (
    <span className={SKELETON_CLASS}>
      <RenyqoSkeleton variant="pill" width={96} height={32} />
      <RenyqoSkeleton variant="circle" width={32} height={32} />
    </span>
  );
}
