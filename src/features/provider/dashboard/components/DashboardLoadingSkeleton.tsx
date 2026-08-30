import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";

function ShellSkeleton() {
  return (
    <div className="flex">
      <div className="hidden w-50 shrink-0 flex-col gap-2.5 border-r border-border p-4 lg:flex">
        <RenyqoSkeleton height={8} width="70%" className="mb-1" />
        <RenyqoSkeleton height={40} />
        <RenyqoSkeleton height={40} />
        <RenyqoSkeleton height={40} />
      </div>

      <div className="min-w-0 flex-1 p-5 lg:p-6">
        <div className="mb-5 flex items-center gap-4 border-b border-border pb-4">
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

        <RenyqoSkeleton height={15} width={200} className="mb-2 max-w-full" />
        <RenyqoSkeleton height={11} width={280} className="mb-5 max-w-full" />

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <RenyqoSkeleton height={52} />
          <RenyqoSkeleton height={52} />
          <RenyqoSkeleton height={52} />
        </div>

        <RenyqoSkeleton height={78} className="mb-3.5" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <RenyqoSkeleton height={40} />
          <RenyqoSkeleton height={40} />
          <RenyqoSkeleton height={40} />
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
