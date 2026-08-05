import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ApplicantListingsView } from "@/features/applicant/listings/components/ApplicantListingsView";

export default function ListingsPage() {
  return (
    <PageShell>
      <ApplicantListingsView />
    </PageShell>
  );
}
