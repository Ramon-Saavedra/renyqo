import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiPatch, apiPatchVoid } from "@/lib/api/client";
import { createListingOverviewItem } from "../testing/listing-overview-fixtures";
import { getProviderListingsOverview } from "./provider-listings-overview";
import {
  archiveProviderListing,
  getProviderListings,
  moveProviderListingToPosition,
  moveProviderListingToDraft,
  publishProviderListing,
} from "./provider-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPatchVoid: vi.fn(),
}));

vi.mock("./provider-listings-overview", () => ({
  getProviderListingsOverview: vi.fn(),
}));

describe("getProviderListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads listings from the overview read model", async () => {
    const items = [createListingOverviewItem({ id: "listing-1" })];
    vi.mocked(getProviderListingsOverview).mockResolvedValue(items);

    await expect(getProviderListings()).resolves.toEqual(items);
    expect(getProviderListingsOverview).toHaveBeenCalledTimes(1);
  });
});

describe("provider listing mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes a provider listing", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await publishProviderListing("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/publish",
    );
  });

  it("moves a provider listing to a position", async () => {
    vi.mocked(apiPatch).mockResolvedValue({});

    await moveProviderListingToPosition("listing-1", 3);

    expect(apiPatch).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/position",
      { position: 3 },
    );
  });

  it("moves a provider listing to draft", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await moveProviderListingToDraft("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/draft",
    );
  });

  it("archives a provider listing", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await archiveProviderListing("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/archive",
    );
  });
});
