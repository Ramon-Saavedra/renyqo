import { ListingCreationGate } from "@/features/provider/workspaces/ListingCreationGate";
import { CreateListingForm } from "@/features/provider/create-listing/components/CreateListingForm";

export default function ProviderCreateListingPage() {
  return (
    <ListingCreationGate>
      <CreateListingForm />
    </ListingCreationGate>
  );
}
