import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ListingsView } from "@/features/provider/listings-overview/components/ListingsView";

export default function ProviderListingsPage() {
  return (
    <PageShell>
      <ListingsView />
    </PageShell>
  );
}
