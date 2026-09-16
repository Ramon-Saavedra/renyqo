import { ListingsView } from "@/features/provider/listings-overview/components/ListingsView";

interface ProviderListingsPageProps {
  searchParams: Promise<{ selected?: string }>;
}

export default async function ProviderListingsPage({
  searchParams,
}: ProviderListingsPageProps) {
  const { selected } = await searchParams;

  return <ListingsView selectedListingId={selected ?? null} />;
}
