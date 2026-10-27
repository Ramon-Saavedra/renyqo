import { describe, expect, it } from "vitest";
import {
  attentionMenuChips,
  globalAttentionItemHref,
  groupGlobalAttentionItems,
  groupGlobalMessageItems,
  providerAttentionDashboardHref,
  resolveGlobalListingTitle,
} from "./global-attention";
import { buildApplicationAttentionChips } from "./chips";
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
    expect(groups[0]?.chips.map((row) => row.chip.kind)).toEqual(["viewing"]);
    expect(groups[0]?.chips.map((row) => row.chip.label)).toEqual([
      attentionCopy.viewingAction(1),
    ]);
    expect(groups[0]?.href).toBe(
      "/applicant/applications/app-1?section=viewing",
    );
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
          pendingActionCount: 1,
          hasPendingAction: true,
        }),
      ],
      "provider",
    );

    expect(groups[0]?.href).toBe(
      "/provider/applications/app-2?listingId=obj-7",
    );
    expect(groups[0]?.listingTitle).toBe("Objekt Nord");
    expect(groups[0]?.listingCity).toBeNull();
  });

  it("keeps a pending chip when the only other chip is an unread message", () => {
    const chips = attentionMenuChips(
      buildApplicationAttentionChips(
        listItem({
          pendingActionCount: 1,
          hasPendingAction: true,
          actionableUnreadMessageCount: 1,
        }),
      ),
    );

    expect(chips.map((chip) => chip.kind)).toEqual(["pending"]);
  });

  it("omits a message-only application from Aufmerksamkeit", () => {
    expect(
      groupGlobalAttentionItems(
        [listItem({ actionableUnreadMessageCount: 1 })],
        "applicant",
      ),
    ).toEqual([]);
  });

  it("lists message-only and mixed applications under Nachrichten", () => {
    const messageOnly = listItem({
      applicationId: "messages-only",
      listingTitle: "Nur Nachricht",
      actionableUnreadMessageCount: 1,
    });
    const actionOnly = listItem({
      applicationId: "action-only",
      listingTitle: "Nur Aktion",
      pendingActionCount: 1,
      hasPendingAction: true,
      categories: {
        documentUploadCount: 0,
        documentReviewCount: 0,
        viewingActionCount: 1,
      },
    });
    const mixed = listItem({
      applicationId: "mixed",
      listingTitle: "Beides",
      pendingActionCount: 1,
      hasPendingAction: true,
      actionableUnreadMessageCount: 2,
    });
    const items = [messageOnly, actionOnly, mixed];

    expect(
      groupGlobalMessageItems(items, "applicant").map((group) => ({
        title: group.listingTitle,
        kinds: group.chips.map((row) => row.chip.kind),
        href: group.href,
      })),
    ).toEqual([
      {
        title: "Nur Nachricht",
        kinds: ["messages"],
        href: "/applicant/applications/messages-only?section=messages",
      },
      {
        title: "Beides",
        kinds: ["messages"],
        href: "/applicant/applications/mixed?section=messages",
      },
    ]);
    expect(
      groupGlobalAttentionItems(items, "applicant").map((group) => ({
        title: group.listingTitle,
        kinds: group.chips.map((row) => row.chip.kind),
      })),
    ).toEqual([
      { title: "Nur Aktion", kinds: ["viewing"] },
      { title: "Beides", kinds: ["pending"] },
    ]);
    expect(groupGlobalMessageItems([messageOnly], "provider")[0]?.href).toBe(
      "/provider/applications/messages-only?listingId=listing-1&section=messages",
    );
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
