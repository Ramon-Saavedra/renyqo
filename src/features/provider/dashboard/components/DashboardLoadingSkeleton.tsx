import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { CANDIDATE_SLOT_CLASS } from "../components/candidate-slot-layout";
import { DashboardTopbar } from "./DashboardTopbar";

function ShellSkeleton() {
  return (
    <div className="flex flex-col lg:h-dvh lg:overflow-hidden lg:flex-row">
      <div className="hidden w-72 shrink-0 flex-col border-r border-border lg:flex lg:h-dvh">
        <div className="shrink-0 px-4 pt-4 pb-3">
          <RenyqoSkeleton height={8} width="70%" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex flex-1 flex-col overflow-hidden rounded-md border border-border bg-background"
            >
              <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
                <RenyqoSkeleton variant="pill" width={76} height={11} />
                <RenyqoSkeleton variant="circle" width={24} height={24} />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-3">
                <div className="flex min-w-0 gap-2.5">
                  <RenyqoSkeleton
                    width={60}
                    height={60}
                    className="shrink-0 rounded-sm"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <RenyqoSkeleton height={13} width="70%" />
                    <RenyqoSkeleton height={11} width="85%" />
                    <RenyqoSkeleton height={14} width="55%" />
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <RenyqoSkeleton height={11} width="40%" />
                  <RenyqoSkeleton height={11} width={28} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
        <DashboardTopbar />

        <div className="px-3 pt-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-gutter scrollbar-slim">
          <div className="mt-4 lg:hidden">
            <RenyqoSkeleton height={11} width={120} />
            <div className="mt-2 flex gap-2 overflow-hidden pb-1">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="flex h-23 w-56 shrink-0 flex-col gap-2 rounded-md border border-border bg-background px-3.5 py-3"
                >
                  <RenyqoSkeleton height={13} width="70%" />
                  <RenyqoSkeleton height={12} width="85%" />
                  <RenyqoSkeleton height={12} width="45%" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <RenyqoSkeleton variant="pill" width={88} height={24} />
          </div>

          <RenyqoSkeleton height={40} className="mt-3 mb-5 w-full" />

          <div className="mb-6 grid grid-cols-3 gap-1.5 md:max-w-2xl md:gap-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-16 flex-col justify-between gap-1 rounded-md border border-border bg-background-subtle px-2 py-1.5 md:min-h-0 md:justify-start md:gap-0.5 md:px-4 md:py-3"
              >
                <RenyqoSkeleton height={10} width="75%" />
                <RenyqoSkeleton
                  height={18}
                  width="40%"
                  className="self-end md:self-auto"
                />
                <RenyqoSkeleton
                  height={10}
                  width="90%"
                  className="hidden md:block"
                />
              </div>
            ))}
          </div>

          <div className="mb-3 flex">
            <RenyqoSkeleton variant="pill" width={72} height={20} />
          </div>

          <div className="mb-6 overflow-hidden rounded-md border border-border bg-background shadow-card">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-1 gap-4">
                <RenyqoSkeleton
                  width={80}
                  height={80}
                  className="hidden shrink-0 rounded-md sm:block"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <RenyqoSkeleton variant="pill" width={100} height={12} />
                  <RenyqoSkeleton
                    height={24}
                    width="65%"
                    className="max-w-full"
                  />
                  <RenyqoSkeleton
                    height={14}
                    width="45%"
                    className="max-w-full"
                  />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <RenyqoSkeleton variant="pill" width={72} height={20} />
                <RenyqoSkeleton width={32} height={32} />
                <RenyqoSkeleton width={32} height={32} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-5 py-3 sm:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <RenyqoSkeleton key={index} height={30} />
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-end justify-between gap-2">
            <div className="flex flex-col gap-2">
              <RenyqoSkeleton height={22} width={160} />
              <RenyqoSkeleton height={12} width={240} className="max-w-full" />
            </div>
            <RenyqoSkeleton variant="pill" width={52} height={14} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className={`${CANDIDATE_SLOT_CLASS} border border-border bg-background-subtle`}
              >
                <RenyqoSkeleton variant="circle" width={32} height={32} />
                <div className="flex h-9 min-w-0 flex-1 flex-col justify-center gap-1">
                  <RenyqoSkeleton height={12} className="w-full max-w-32" />
                  <RenyqoSkeleton height={11} className="w-full max-w-24" />
                </div>
              </div>
            ))}
          </div>

          <div
            data-testid="waiting-queue-skeleton"
            className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background-subtle px-3 py-2 sm:min-h-11 sm:px-4"
          >
            <RenyqoSkeleton variant="circle" width={16} height={16} />
            <RenyqoSkeleton height={13} width="65%" className="max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Global first-load state for the provider dashboard (Renyqo pattern 01): a
 * single vertical light sweep across the whole shell instead of a spinner.
 */
export function DashboardLoadingSkeleton() {
  return (
    <PageShell className="lg:pb-0">
      <ShellSkeleton />
    </PageShell>
  );
}
