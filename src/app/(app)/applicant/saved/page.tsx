import { PageShell } from "@/components/layout/page-shell/PageShell";
import { SavedListingsView } from "@/features/applicant/listings/components/SavedListingsView";

export default function ApplicantSavedListingsPage() {
  return (
    <PageShell>
      <SavedListingsView />
    </PageShell>
  );
}
