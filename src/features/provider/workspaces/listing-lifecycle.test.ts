import { describe, expect, it } from "vitest";
import { parseDisplayOrder } from "@/features/provider/listings-overview/api/parse-display-order";
import { mapProviderListingDetail } from "@/features/provider/listing-detail/api/provider-listing-detail";
describe("canonical listing lifecycle", () => {
  it("retains RETIRED and permits a released display-order slot", () => {
    expect(mapProviderListingDetail({ id: "listing", status: "RETIRED" })?.status).toBe("retired");
    expect(parseDisplayOrder(null)).toBeNull();
    expect(parseDisplayOrder(1)).toBe(1);
  });
  it.each(["ARCHIVED", "UNKNOWN", "", null])("never converts %s to DRAFT", status => {
    expect(() => mapProviderListingDetail({ id: "listing", status })).toThrow("Invalid listing status");
  });
});
