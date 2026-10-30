import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import {
  DASHBOARD_MATRIX_CLASS,
  DASHBOARD_BLOCK_CLASS,
} from "./dashboard-layout";

function TopbarSkeleton() {
  return (
    <div className="flex h-app-topbar shrink-0 items-center gap-x-3 border-b border-border px-gutter sm:gap-x-6">
      <RenyqoSkeleton width={100} height={22} className="rounded-sm" />
      <div className="ml-auto flex items-center gap-2">
        <RenyqoSkeleton className="h-8 w-8 rounded-sm sm:h-11 sm:w-14 sm:rounded-md lg:w-40" />
        <RenyqoSkeleton className="h-8 w-8 rounded-sm sm:h-11 sm:w-48 sm:rounded-md" />
        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3 sm:pl-4">
          <RenyqoSkeleton className="h-9 w-9 rounded-md" />
          <RenyqoSkeleton variant="circle" className="h-7 w-7 sm:h-8 sm:w-8" />
          <RenyqoSkeleton
            variant="text"
            className="hidden h-3.5 w-24 md:block"
          />
        </div>
      </div>
    </div>
  );
}

function MatrixSkeleton() {
  return (
    <div className={DASHBOARD_MATRIX_CLASS}>
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={`matrix-cell-${index}`}
          className="flex w-36 shrink-0 items-start gap-1 rounded-md border border-border px-2 py-1"
        >
          <div className="min-w-0 flex-1">
            <RenyqoSkeleton height={64} className="mb-1 w-full rounded-md" />
            <RenyqoSkeleton
              variant="text"
              height={11}
              width="80%"
              className="mt-1.5"
            />
            <RenyqoSkeleton
              variant="text"
              height={9}
              width="45%"
              className="mt-0.5"
            />
            <div className="mt-1 flex h-4 items-center justify-between gap-0.5">
              {Array.from({ length: 5 }).map((_, slotIndex) => (
                <RenyqoSkeleton
                  key={`matrix-slot-${index}-${slotIndex}`}
                  className="h-4 w-4"
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <RenyqoSkeleton className="h-6 w-6 rounded-sm" />
            <RenyqoSkeleton className="h-6 w-6 rounded-sm" />
            <RenyqoSkeleton className="h-6 w-6 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectedObjectSkeleton() {
  return (
    <div className={DASHBOARD_BLOCK_CLASS}>
      <RenyqoSkeleton
        variant="text"
        width={200}
        height={28}
        className="mb-section"
      />
      <div className="mb-section flex flex-wrap items-start gap-card-x">
        <div className="min-w-0 flex-1 basis-75">
          <RenyqoSkeleton
            variant="text"
            width={100}
            height={12}
            className="mb-2"
          />
          <div className="flex items-center gap-card-x">
            <RenyqoSkeleton
              width={80}
              height={80}
              className="shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <RenyqoSkeleton
                variant="text"
                width="60%"
                height={28}
                className="mb-1"
              />
              <RenyqoSkeleton variant="text" width="35%" height={14} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RenyqoSkeleton height={44} className="w-11 rounded-md sm:w-24" />
          <RenyqoSkeleton height={44} className="w-11 rounded-md sm:w-24" />
          <RenyqoSkeleton height={44} className="w-11 rounded-md sm:w-24" />
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
    <div className={`${DASHBOARD_BLOCK_CLASS} flex flex-col gap-section`}>
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
        <RenyqoSkeleton variant="text" width={110} height={11} />
        <RenyqoSkeleton variant="text" width={76} height={12} />
      </div>
      <div className="grid grid-cols-2 gap-3 @min-[640px]:grid-cols-3 @min-[1024px]:grid-cols-6">
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
    <div className="@container flex w-full flex-col px-gutter pt-7 pb-16">
      <div className="mb-section flex flex-col gap-2 rounded-md border border-border px-parent-x py-parent-y sm:flex-row sm:items-center">
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

      <div className="mb-section">
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
