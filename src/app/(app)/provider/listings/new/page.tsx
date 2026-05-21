import { PageShell } from "@/components/layout/page-shell/PageShell";
import { CreateListingForm } from "@/features/provider/create-listing/components/CreateListingForm";

export default function ProviderCreateListingPage() {
  return (
    <PageShell>
      <CreateListingForm />
    </PageShell>
  );
}
