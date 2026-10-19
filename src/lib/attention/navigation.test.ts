import { describe, expect, it } from "vitest";
import {
  applicationWorkspaceHref,
  listingAttentionHref,
  listingHref,
} from "./navigation";
import { emptyApplicationAttentionSummary } from "./fixtures";
import type { ApplicantListingAttention } from "./types";

describe("listingHref", () => {
  it("encodes listing id", () => {
    expect(listingHref("abc/def")).toBe("/listings/abc%2Fdef");
  });
});

describe("applicationWorkspaceHref", () => {
  it("builds applicant workspace path", () => {
    expect(applicationWorkspaceHref("app-1")).toBe(
      "/applicant/applications/app-1",
    );
  });
});

describe("listingAttentionHref", () => {
  it("returns null when attention is missing or empty", () => {
    expect(listingAttentionHref(null)).toBeNull();
    expect(
      listingAttentionHref({
        ...emptyApplicationAttentionSummary(),
        applicationId: "app-1",
      } satisfies ApplicantListingAttention),
    ).toBeNull();
  });

  it("links to the application workspace when attention is surfaced", () => {
    expect(
      listingAttentionHref({
        ...emptyApplicationAttentionSummary(),
        applicationId: "app-1",
        actionableUnreadMessageCount: 1,
      }),
    ).toBe("/applicant/applications/app-1");
  });
});
