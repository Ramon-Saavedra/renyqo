"use client";

import { useParams } from "next/navigation";
import { ListingDetailView } from "@/features/applicant/listings/components/detail/ListingDetailView";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <ListingDetailView listingId={id} />;
}
