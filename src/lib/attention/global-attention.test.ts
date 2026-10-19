import { describe, expect, it } from "vitest";
import {
  globalAttentionItemHref,
  groupGlobalAttentionItems,
  providerAttentionDashboardHref,
  resolveGlobalListingTitle,
} from "./global-attention";
import { attentionCopy } from "./copy";
import { emptyApplicationAttentionSummary } from "./fixtures";

function listItem(
  overrides: Partial<
    ReturnType<typeof emptyApplicationAttentionSummary> & {
      applicationId: string;
      listingId: string;
      listingTitle: string | null;
      listingCity: string | null;
    }
  > = {},
) {
  return {
    ...emptyApplicationAttentionSummary(),
    applicationId: "app-1",
    listingId: "listing-1",
    listingTitle: "3-Zimmer-Wohnung",
    listingCity: "Freiburg",
    ...overrides,
  };
}

describe("resolveGlobalListingTitle", () => {
  it("uses backend title when present", () => {
    expect(resolveGlobalListingTitle("Wohnung")).toBe("Wohnung");
  });

  it("falls back without showing listing ids", () => {
    expect(resolveGlobalListingTitle(null)).toBe(
      attentionCopy.listingTitleFallback,
    );
    expect(resolveGlobalListingTitle("   ")).toBe(
      attentionCopy.listingTitleFallback,
    );
  });
});

describe("globalAttentionItemHref", () => {
  it("routes applicants to the application workspace", () => {
    expect(
      globalAttentionItemHref(
        { applicationId: "app-1", listingId: "listing-1" },
        "applicant",
      ),
    ).toBe("/applicant/applications/app-1");
  });

  it("routes providers to the dashboard with listing selection", () => {
    expect(
      globalAttentionItemHref(
        { applicationId: "app-1", listingId: "listing-9" },
        "provider",
      ),
    ).toBe(providerAttentionDashboardHref("listing-9"));
  });
});

describe("groupGlobalAttentionItems", () => {
  it("returns no groups when attention surface is empty", () => {
    expect(groupGlobalAttentionItems([listItem()], "applicant")).toEqual([]);
  });

  it("groups chips under one listing header per application", () => {
    const groups = groupGlobalAttentionItems(
      [
        listItem({
          actionableUnreadMessageCount: 2,
          categories: {
            documentUploadCount: 0,
            documentReviewCount: 0,
            viewingActionCount: 1,
          },
        }),
      ],
      "applicant",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.listingTitle).toBe("3-Zimmer-Wohnung");
    expect(groups[0]?.listingCity).toBe("Freiburg");
    expect(groups[0]?.chips.map((row) => row.chip.label)).toEqual([
      attentionCopy.unreadMessages(2),
      attentionCopy.viewingAction(1),
    ]);
    expect(groups[0]?.href).toBe("/applicant/applications/app-1");
    expect(groups[0]?.listingTitle.includes("listing-1")).toBe(false);
  });

  it("uses provider dashboard href per group", () => {
    const groups = groupGlobalAttentionItems(
      [
        listItem({
          applicationId: "app-2",
          listingId: "obj-7",
          listingTitle: "Objekt Nord",
          listingCity: null,
          actionableUnreadMessageCount: 1,
        }),
      ],
      "provider",
    );

    expect(groups[0]?.href).toBe("/provider/dashboard?listingId=obj-7");
    expect(groups[0]?.listingTitle).toBe("Objekt Nord");
    expect(groups[0]?.listingCity).toBeNull();
  });

  it("renders document labels from documentIndicators", () => {
    const groups = groupGlobalAttentionItems(
      [
        listItem({
          applicationId: "app-3",
          documentIndicators: [
            {
              requestId: "req-1",
              type: "INCOME_PROOF",
              customLabel: null,
              status: "UPLOAD_REQUIRED",
            },
          ],
        }),
      ],
      "applicant",
    );

    expect(groups[0]?.chips[0]?.chip.label).toBe(
      "Einkommensnachweis erforderlich",
    );
  });

  it("omits redundant generic pending chips when concrete chips exist", () => {
    const groups = groupGlobalAttentionItems(
      [
        listItem({
          pendingActionCount: 2,
          hasPendingAction: true,
          documentIndicators: [
            {
              requestId: "req-1",
              type: "SCHUFA",
              customLabel: null,
              status: "UPLOAD_REQUIRED",
            },
          ],
          categories: {
            documentUploadCount: 1,
            documentReviewCount: 0,
            viewingActionCount: 1,
          },
        }),
      ],
      "applicant",
    );

    expect(groups[0]?.chips.map((row) => row.chip.kind)).toEqual([
      "documentUpload",
      "viewing",
    ]);
  });
});
