import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";

function TopbarSkeleton() {
  return (
    <div className="flex h-app-topbar shrink-0 items-center gap-3 border-b border-border px-3 lg:px-gutter">
      <RenyqoSkeleton width={100} height={22} className="rounded-sm" />
      <div className="ml-auto flex items-center gap-2">
        <RenyqoSkeleton className="h-8 w-8 rounded-sm sm:h-11 sm:min-w-16 sm:w-auto sm:rounded-md" />
        <RenyqoSkeleton className="h-8 w-8 rounded-sm sm:h-11 sm:min-w-14 sm:w-auto sm:rounded-md" />
        <RenyqoSkeleton width={32} height={32} className="ml-1 rounded-md" />
      </div>
    </div>
  );
}

function MatrixSkeleton() {
  return (
    <div className="scrollbar-slim flex flex-nowrap items-start gap-x-3 overflow-x-scroll px-1 pt-2 pb-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={`matrix-cell-${index}`}
          className="flex w-22 shrink-0 flex-col gap-1.5 @min-[640px]:w-24"
        >
          <RenyqoSkeleton height={64} className="w-full rounded-md" />
          <RenyqoSkeleton variant="text" height={11} width="80%" />
          <RenyqoSkeleton variant="text" height={9} width="45%" />
        </div>
      ))}
    </div>
  );
}

function SelectedObjectSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-6">
      <RenyqoSkeleton variant="text" width={140} height={11} />
      <div className="flex flex-wrap items-start gap-card-x">
        <div className="min-w-0 flex-1 basis-75">
          <div className="mt-2 flex items-center gap-card-x">
            <RenyqoSkeleton
              width={80}
              height={80}
              className="hidden rounded-md sm:block"
            />
            <div className="min-w-0 flex-1">
              <RenyqoSkeleton variant="text" width="60%" height={28} />
              <RenyqoSkeleton
                variant="text"
                width="35%"
                height={14}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RenyqoSkeleton width={90} height={44} className="rounded-md" />
          <RenyqoSkeleton width={90} height={44} className="rounded-md" />
          <RenyqoSkeleton width={90} height={44} className="rounded-md" />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-card-x gap-y-card-y">
        {Array.from({ length: 5 }).map((_, index) => (
          <RenyqoSkeleton
            key={`fact-${index}`}
            variant="text"
            width={72}
            height={13}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicantsSkeleton() {
  return (
    <div className="mt-11 flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
        <RenyqoSkeleton variant="text" width={110} height={11} />
        <RenyqoSkeleton variant="text" width={76} height={12} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`applicant-${index}`}
            className="flex min-w-0 flex-col gap-3 rounded-md border border-border/50 bg-background-muted px-card-x py-card-y"
          >
            <RenyqoSkeleton width={32} height={32} className="rounded-md" />
            <RenyqoSkeleton variant="text" height={15} width="70%" />
            <RenyqoSkeleton variant="text" height={12} width="45%" />
            <div className="mt-1 flex items-center justify-between border-t border-border px-1.5 pt-1.5">
              <RenyqoSkeleton width={24} height={24} className="rounded-md" />
              <RenyqoSkeleton width={24} height={24} className="rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex min-w-13 flex-1 items-center gap-0.75">
          {Array.from({ length: 5 }).map((_, index) => (
            <RenyqoSkeleton
              key={`capacity-slot-${index}`}
              height={2}
              className="flex-1 rounded-full"
            />
          ))}
        </div>
        <RenyqoSkeleton variant="text" width={70} height={11} />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="flex w-full flex-col px-3 pt-7 pb-16 lg:px-gutter">
      <div className="mb-6 flex flex-col gap-2 rounded-md border border-border px-parent-x py-parent-y sm:flex-row sm:items-center">
        <RenyqoSkeleton
          height={38}
          className="w-full rounded-md bg-primary-foreground/20 sm:min-w-45 sm:flex-1"
        />
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <RenyqoSkeleton width={100} height={38} className="rounded-md" />
          <RenyqoSkeleton width={100} height={38} className="rounded-md" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <RenyqoSkeleton variant="text" width={110} height={12} />
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <RenyqoSkeleton
              key={`listing-stat-${index}`}
              variant="text"
              width={index === 0 ? 64 : 82}
              height={13}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <MatrixSkeleton />
      </div>

      <SelectedObjectSkeleton />
      <ApplicantsSkeleton />
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <PageShell className="lg:pb-0">
      <div>
        <TopbarSkeleton />
        <div className="pt-2">
          <div className="mb-3 flex justify-end">
            <RenyqoLoadingDots
              label={dashboardCopy.loading}
              className="sr-only"
            />
          </div>
          <RenyqoReveal
            loading
            vertical
            showRingPulse={false}
            skeleton={<ContentSkeleton />}
          />
        </div>
      </div>
    </PageShell>
  );
}
