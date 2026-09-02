import { PageShell } from "@/components/layout/page-shell/PageShell";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-x lg:border-border">
      <div className="flex items-start justify-between gap-3 px-dashboard-parent-x py-dashboard-parent-y">
        <div className="flex min-w-0 flex-col gap-1">
          <RenyqoSkeleton height={10} width={64} />
          <RenyqoSkeleton height={10} width={24} />
        </div>
        <RenyqoSkeleton width={28} height={28} className="rounded-sm" />
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-dashboard-parent-x pb-dashboard-parent-y">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={`sidebar-slot-${index}`}
            className="flex flex-1 flex-col gap-2 rounded-md border border-border bg-background-muted px-dashboard-card-x py-dashboard-card-y"
          >
            <div className="flex items-center gap-1.5">
              <RenyqoSkeleton width={6} height={6} variant="circle" />
              <RenyqoSkeleton height={9} width={56} />
            </div>
            <div className="flex min-w-0 gap-2.5">
              <RenyqoSkeleton width={60} height={60} className="rounded-sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 justify-center">
                <RenyqoSkeleton height={11} width="85%" />
                <RenyqoSkeleton height={10} width="70%" />
                <RenyqoSkeleton height={10} width="50%" />
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5">
              <RenyqoSkeleton width={88} height={8} />
              <RenyqoSkeleton width={32} height={8} />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TopbarSkeleton() {
  return (
    <div className="mb-4 flex shrink-0 items-center gap-x-3 border-b border-border px-3 py-3.5 sm:mb-0 sm:gap-x-6 sm:py-4 lg:px-gutter">
      <RenyqoSkeleton variant="pill" width={110} height={22} />
      <div className="ml-auto flex items-center gap-2">
        <RenyqoSkeleton
          width={28}
          height={28}
          className="rounded-sm border border-border-strong sm:h-11 sm:w-auto sm:min-w-16 sm:rounded-md"
        />
        <RenyqoSkeleton
          width={28}
          height={28}
          className="rounded-sm border border-border-strong sm:h-11 sm:w-auto sm:min-w-14 sm:rounded-md"
        />
        <RenyqoSkeleton
          width={32}
          height={32}
          className="ml-1 rounded-sm border border-border sm:ml-0"
        />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="flex w-full flex-col px-3 pt-1 lg:px-gutter">
      <div className="mb-3 flex justify-end">
        <RenyqoSkeleton variant="pill" width={120} height={20} />
      </div>

      <div className="relative mb-4 w-full">
        <RenyqoSkeleton
          height={40}
          className="rounded-md border border-border-strong bg-input"
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1.5 md:max-w-2xl md:gap-2.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`stat-${index}`}
            className="flex flex-col gap-2 rounded-md border border-border bg-background-muted px-dashboard-card-x py-dashboard-card-y"
          >
            <RenyqoSkeleton width={72} height={8} />
            <RenyqoSkeleton height={22} width={40} />
          </div>
        ))}
      </div>

      <div className="mb-6 overflow-hidden rounded-md">
        <div className="flex flex-col gap-3 px-dashboard-card-x py-dashboard-card-y">
          <div className="flex items-center gap-4">
            <RenyqoSkeleton
              width={80}
              height={80}
              className="hidden rounded-md sm:block"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <RenyqoSkeleton width={120} height={9} />
              <RenyqoSkeleton width="90%" height={18} />
              <RenyqoSkeleton width="60%" height={12} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 px-dashboard-card-x py-dashboard-card-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`cell-${index}`} className="flex flex-col gap-1">
              <RenyqoSkeleton width={72} height={8} />
              <RenyqoSkeleton width={56} height={14} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md bg-background-muted px-dashboard-parent-x py-dashboard-parent-y">
        <div className="mb-4 flex flex-col gap-1.5">
          <RenyqoSkeleton width={180} height={18} />
          <RenyqoSkeleton width={260} height={11} className="max-w-full" />
        </div>
        <div className="flex flex-col gap-2 lg:flex-row">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`lane-${index}`}
              className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-background-muted px-dashboard-card-x py-dashboard-card-y"
            >
              <RenyqoSkeleton width={32} height={32} variant="circle" />
              <div className="flex h-9 min-w-0 flex-1 flex-col justify-center gap-1">
                <RenyqoSkeleton height={12} width="80%" className="max-w-32" />
                <RenyqoSkeleton height={11} width="60%" className="max-w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex flex-col lg:h-dvh lg:overflow-hidden lg:flex-row">
      <SidebarSkeleton />
      <div className="min-w-0 flex-1 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
        <TopbarSkeleton />
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto scrollbar-slim">
          <ContentSkeleton />
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
