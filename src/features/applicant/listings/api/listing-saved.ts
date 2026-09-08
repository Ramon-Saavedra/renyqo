import { z } from "zod";
import { apiDelete, apiPut } from "@/lib/api/client";

const savedListingStateSchema = z.object({
  saved: z.literal(true),
  savedAt: z.string().datetime(),
});

const unsavedListingStateSchema = z.object({
  saved: z.literal(false),
  savedAt: z.null(),
});

export type SavedListingState =
  | z.infer<typeof savedListingStateSchema>
  | z.infer<typeof unsavedListingStateSchema>;

export class ListingSavedContractError extends Error {
  constructor() {
    super("Invalid saved listing response");
    this.name = "ListingSavedContractError";
  }
}

function savedListingPath(listingId: string): string {
  return `/api/v1/applicant/listings/${encodeURIComponent(listingId)}/saved`;
}

export async function saveListing(
  listingId: string,
): Promise<SavedListingState> {
  const parsed = savedListingStateSchema.safeParse(
    await apiPut<unknown>(savedListingPath(listingId)),
  );
  if (!parsed.success) throw new ListingSavedContractError();
  return parsed.data;
}

export async function unsaveListing(
  listingId: string,
): Promise<SavedListingState> {
  const parsed = unsavedListingStateSchema.safeParse(
    await apiDelete<unknown>(savedListingPath(listingId)),
  );
  if (!parsed.success) throw new ListingSavedContractError();
  return parsed.data;
}
