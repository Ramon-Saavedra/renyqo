import { ListingDetailView } from "@/features/provider/listing-detail/components/ListingDetailView";

interface ProviderListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderListingDetailPage({
  params,
}: ProviderListingDetailPageProps) {
  const { id } = await params;

  return <ListingDetailView listingId={id} />;
}
