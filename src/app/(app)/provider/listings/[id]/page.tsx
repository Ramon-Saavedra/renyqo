import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ListingDetailView } from "@/features/provider/listing-detail/components/ListingDetailView";

interface ProviderListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderListingDetailPage({
  params,
}: ProviderListingDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell>
      <ListingDetailView listingId={id} />
    </PageShell>
  );
}
