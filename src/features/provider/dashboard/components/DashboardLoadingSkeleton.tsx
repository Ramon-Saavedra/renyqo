import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";

function ShellSkeleton() {
  return (
    <div className="flex">
      <div className="hidden w-72 shrink-0 flex-col gap-3 border-r border-border p-4 lg:flex">
        <RenyqoSkeleton height={8} width="70%" className="mb-1" />
        <RenyqoSkeleton height={44} />
        <RenyqoSkeleton height={44} />
        <RenyqoSkeleton height={44} />
      </div>

      <div className="min-w-0 flex-1 px-3 pt-1 lg:px-gutter">
        <div className="mb-4 flex h-12 items-center gap-4 border-b border-border">
          <RenyqoSkeleton variant="circle" width={20} height={20} />
          <RenyqoSkeleton
            variant="pill"
            width={220}
            height={26}
            className="max-w-full"
          />
          <RenyqoSkeleton
            variant="circle"
            width={26}
            height={26}
            className="ml-auto"
          />
        </div>

        <div className="mb-3 flex justify-end">
          <RenyqoSkeleton variant="pill" width={88} height={24} />
        </div>

        <RenyqoSkeleton height={40} className="mb-5 w-full" />

        <div className="mb-6 grid grid-cols-3 gap-1.5 md:max-w-2xl md:gap-2.5">
          <RenyqoSkeleton height={64} />
          <RenyqoSkeleton height={64} />
          <RenyqoSkeleton height={64} />
        </div>

        <div className="mb-3 flex">
          <RenyqoSkeleton variant="pill" width={72} height={20} />
        </div>

        <div className="mb-7 overflow-hidden rounded-md border border-primary bg-primary">
          <div className="flex flex-col gap-4 border-b border-primary-foreground/20 px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-1 gap-5">
              <RenyqoSkeleton
                width={92}
                height={92}
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

          <div className="grid grid-cols-2 gap-4 px-6 py-4 sm:grid-cols-3 xl:grid-cols-6">
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
              className="flex min-h-55 flex-col gap-3 rounded-md border border-border bg-background-subtle px-2 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <RenyqoSkeleton variant="circle" width={32} height={32} />
                <div className="flex flex-col items-end gap-1">
                  <RenyqoSkeleton height={11} width={80} />
                  <RenyqoSkeleton height={10} width={56} />
                </div>
              </div>
              <RenyqoSkeleton height={28} />
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <RenyqoSkeleton height={12} />
                <RenyqoSkeleton height={12} />
                <RenyqoSkeleton height={12} />
              </div>
              <RenyqoSkeleton variant="pill" height={24} />
              <div className="mt-auto flex gap-1">
                <RenyqoSkeleton height={32} />
                <RenyqoSkeleton height={32} />
              </div>
            </div>
          ))}
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
      <div className="px-gutter pt-4">
        <div className="mb-3 flex justify-end">
          <RenyqoLoadingDots label={dashboardCopy.loading} />
        </div>
        <RenyqoReveal loading vertical skeleton={<ShellSkeleton />} />
      </div>
    </PageShell>
  );
}
