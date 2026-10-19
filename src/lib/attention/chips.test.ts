import { describe, expect, it } from "vitest";
import {
  buildApplicationAttentionChips,
  buildListingAttentionChips,
  filterGlobalMenuAttentionChips,
  groupAttentionChipsForIcons,
} from "./chips";
import {
  emptyApplicationAttentionSummary,
  emptyAttentionTotals,
} from "./fixtures";

describe("buildApplicationAttentionChips", () => {
  it("expands UPLOAD_REQUIRED documentIndicators into labeled chips", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      documentIndicators: [
        {
          requestId: "req-1",
          type: "SCHUFA",
          customLabel: null,
          status: "UPLOAD_REQUIRED",
        },
        {
          requestId: "req-2",
          type: "OTHER",
          customLabel: "Sondernachweis",
          status: "UPLOAD_REQUIRED",
        },
      ],
    });

    expect(chips.map((chip) => chip.label)).toEqual([
      "SCHUFA erforderlich",
      "Sondernachweis erforderlich",
    ]);
  });

  it("orders pending and message chips before category chips", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      pendingActionCount: 2,
      hasPendingAction: true,
      actionableUnreadMessageCount: 1,
      categories: {
        documentUploadCount: 1,
        documentReviewCount: 0,
        viewingActionCount: 0,
      },
    });
    expect(chips.map((chip) => chip.kind)).toEqual([
      "pending",
      "messages",
      "documentUpload",
    ]);
  });
});

describe("filterGlobalMenuAttentionChips", () => {
  it("drops pending chips when concrete category chips are present", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      pendingActionCount: 2,
      hasPendingAction: true,
      actionableUnreadMessageCount: 1,
      categories: {
        documentUploadCount: 0,
        documentReviewCount: 0,
        viewingActionCount: 0,
      },
    });
    expect(
      filterGlobalMenuAttentionChips(chips).map((chip) => chip.kind),
    ).toEqual(["messages"]);
  });

  it("keeps pending when no concrete chips exist", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      pendingActionCount: 1,
      hasPendingAction: true,
    });
    expect(
      filterGlobalMenuAttentionChips(chips).map((chip) => chip.kind),
    ).toEqual(["pending"]);
  });
});

describe("groupAttentionChipsForIcons", () => {
  it("merges pending and document upload into one file-upload icon group", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      pendingActionCount: 1,
      hasPendingAction: true,
      documentIndicators: [
        {
          requestId: "req-1",
          type: "SCHUFA",
          customLabel: null,
          status: "UPLOAD_REQUIRED",
        },
      ],
    });

    const groups = groupAttentionChipsForIcons(chips);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("file-upload");
    expect(groups[0]?.label).toContain("SCHUFA erforderlich");
  });

  it("merges chips by kind for icon-only listing UI", () => {
    const chips = buildApplicationAttentionChips({
      ...emptyApplicationAttentionSummary(),
      actionableUnreadMessageCount: 2,
      categories: {
        documentUploadCount: 0,
        documentReviewCount: 0,
        viewingActionCount: 1,
      },
    });

    expect(groupAttentionChipsForIcons(chips).map((group) => group.id)).toEqual(
      ["messages", "viewing"],
    );
    expect(
      groupAttentionChipsForIcons(chips).find(
        (group) => group.kind === "messages",
      )?.count,
    ).toBe(2);
  });
});

describe("buildListingAttentionChips", () => {
  it("uses listing aggregate counts", () => {
    const chips = buildListingAttentionChips({
      ...emptyAttentionTotals(),
      totalPendingActions: 3,
      actionableUnreadMessageCount: 2,
    });
    expect(chips.map((chip) => chip.kind)).toEqual(["pending", "messages"]);
    expect(chips[0]?.count).toBe(3);
  });
});
