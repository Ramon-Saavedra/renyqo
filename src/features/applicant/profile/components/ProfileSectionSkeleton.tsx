import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";

interface ProfileSectionSkeletonProps {
  rows: number;
  paired?: boolean;
}

export function ProfileSectionSkeleton({
  rows,
  paired = false,
}: ProfileSectionSkeletonProps) {
  return (
    <div className="flex flex-col gap-4.5 px-7 py-6.5">
      <div className="mb-1 flex flex-col gap-2">
        <RenyqoSkeleton height={12} width={120} />
        <RenyqoSkeleton height={19} width={220} className="max-w-full" />
        <RenyqoSkeleton height={13} width={280} className="max-w-full" />
      </div>
      <RenyqoSkeleton height={44} />
      {paired && (
        <div className="grid gap-4 sm:grid-cols-2">
          <RenyqoSkeleton height={44} />
          <RenyqoSkeleton height={44} />
        </div>
      )}
      {Array.from({ length: rows }, (_, index) => (
        <RenyqoSkeleton key={index} height={44} />
      ))}
    </div>
  );
}
