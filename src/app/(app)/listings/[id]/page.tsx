"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ListingDetailView } from "@/features/applicant/listings/components/detail/ListingDetailView";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PageShell>
      <ListingDetailView listingId={id} />
    </PageShell>
  );
}
