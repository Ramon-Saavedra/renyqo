import { Suspense } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ApplicantListingsView } from "@/features/applicant/listings/components/ApplicantListingsView";
import { ListingsLoadingGrid } from "@/features/applicant/listings/components/ListingsLoadingGrid";
import { ListingsTopbarActions } from "@/features/applicant/navigation/components/ListingsTopbarActions";

function ListingsPageFallback() {
  return (
    <>
      <AppTopbar>
        <ListingsTopbarActions />
      </AppTopbar>
      <div className="px-gutter pt-10">
        <ListingsLoadingGrid />
      </div>
    </>
  );
}

export default function ListingsPage() {
  return (
    <PageShell>
      <Suspense fallback={<ListingsPageFallback />}>
        <ApplicantListingsView />
      </Suspense>
    </PageShell>
  );
}
