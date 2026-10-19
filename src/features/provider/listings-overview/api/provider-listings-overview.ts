import { z } from "zod";
import { apiGet } from "@/lib/api/client";
import { attentionTotalsSchema } from "@/lib/attention/schemas";
import { matchesProviderAttentionFilter } from "@/lib/attention/visibility";
import { normalizeObjectType } from "@/lib/api/listings";
import {
  isRecord,
  readItems,
  readNumber,
  readString,
  readNullableString,
  type ApiRecord,
} from "@/lib/api/response-mappers";
import { parseDisplayOrder } from "./parse-display-order";
import type { ListingOverviewItem, ListingStatus } from "../types";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";
const PAGE_SIZE = 100;

const compactListingSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable(),
  city: z.string().nullable(),
  coldRent: z.number().finite().nullable(),
  status: z.string().min(1),
  imageUrl: z.string().min(1).nullable(),
});

const overviewItemSchema = z.object({
  listing: compactListingSchema,
  activeApplicationsCount: z.number().int().nonnegative(),
  waitingCount: z.number().int().nonnegative(),
  exitedApplicationsCount: z.number().int().nonnegative(),
  attention: attentionTotalsSchema,
});

const overviewPageSchema = z.object({
  items: z.array(overviewItemSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
  }),
  totalCount: z.number().int().nonnegative(),
});

export class ProviderListingsOverviewContractError extends Error {
  constructor() {
    super("Invalid provider listings overview response");
    this.name = "ProviderListingsOverviewContractError";
  }
}

function normalizeStatus(value: string): ListingStatus {
  const normalized = value.toLowerCase();
  if (normalized === "published") return "published";
  if (normalized === "draft") return "draft";
  if (normalized === "paused") return "paused";
  if (normalized === "archived") return "archived";
  if (normalized === "rented") return "rented";
  return "draft";
}

function mapOverviewItem(
  item: z.infer<typeof overviewItemSchema>,
  details?: ApiRecord,
): ListingOverviewItem {
  const listing = item.listing;
  const title = listing.title?.trim();
  const facts = details ?? {};
  return {
    id: listing.id,
    ...(details
      ? { displayOrder: parseDisplayOrder(details.displayOrder) }
      : {}),
    title: title && title.length > 0 ? title : "Unbenanntes Objekt",
    objectType: normalizeObjectType(readString(facts, ["objectType", "type"])),
    displayAddress: details
      ? buildDisplayAddress(details)
      : listing.city?.trim() || "Adresse offen",
    coverImageUrl: listing.imageUrl,
    coldRent: listing.coldRent ?? 0,
    deposit: readNumber(facts, ["deposit"]) ?? 0,
    depositMonths: readNumber(facts, ["depositMonths"]) ?? 0,
    livingArea: readNumber(facts, ["livingArea", "area"]) ?? 0,
    rooms: readNumber(facts, ["rooms"]) ?? 0,
    status: normalizeStatus(listing.status),
    activeApplicationsCount: item.activeApplicationsCount,
    attention: item.attention,
    needsAttention: matchesProviderAttentionFilter(item.attention),
    createdAt: readString(facts, ["createdAt"]) ?? FALLBACK_DATE,
    updatedAt: readString(facts, ["updatedAt"]) ?? FALLBACK_DATE,
    publishedAt: readNullableString(facts, ["publishedAt"]),
    availableFrom: readNullableString(facts, [
      "availableFrom",
      "available_from",
      "moveInDate",
      "move_in_date",
    ]),
  };
}

function buildDisplayAddress(details: ApiRecord): string {
  const existing = readString(details, ["displayAddress", "address"]);
  if (existing) return existing;
  const street = readString(details, ["street"]);
  const zip = readString(details, ["zip", "postalCode"]);
  const city = readString(details, ["city"]);
  const district = readString(details, ["district", "neighborhood"]);
  return (
    [street, [city, district].filter(Boolean).join(", "), zip]
      .filter(Boolean)
      .join(" · ") || "Adresse offen"
  );
}

async function fetchOverviewPage(
  cursor: string | null,
): Promise<z.infer<typeof overviewPageSchema>> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  const path = `/api/v1/provider/listings/overview?${params.toString()}`;
  const parsed = overviewPageSchema.safeParse(await apiGet<unknown>(path));
  if (!parsed.success) throw new ProviderListingsOverviewContractError();
  if (parsed.data.pagination.hasMore && !parsed.data.pagination.nextCursor) {
    throw new ProviderListingsOverviewContractError();
  }
  return parsed.data;
}

export async function getProviderListingsOverview(): Promise<
  readonly ListingOverviewItem[]
> {
  const items: ListingOverviewItem[] = [];
  // The compact attention projection omits property facts and display order.
  // Fetch the full list once, rather than one detail request per property.
  const details = new Map<string, ApiRecord>();
  const [detailsResponse, firstPage] = await Promise.all([
    apiGet<unknown>("/api/v1/provider/listings"),
    fetchOverviewPage(null),
  ]);
  for (const record of readItems(detailsResponse)) {
    if (!isRecord(record)) continue;
    const id = readString(record, ["id"]);
    if (id) details.set(id, record);
  }
  let cursor: string | null = null;
  const seenCursors = new Set<string>();
  let page = firstPage;
  do {
    items.push(
      ...page.items.map((item) =>
        mapOverviewItem(item, details.get(item.listing.id)),
      ),
    );
    cursor =
      page.pagination.hasMore && page.pagination.nextCursor
        ? page.pagination.nextCursor
        : null;
    if (cursor) {
      if (seenCursors.has(cursor))
        throw new ProviderListingsOverviewContractError();
      seenCursors.add(cursor);
      page = await fetchOverviewPage(cursor);
    }
  } while (cursor);
  return items;
}
