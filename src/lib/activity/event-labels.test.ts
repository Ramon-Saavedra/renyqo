import { describe, expect, it } from "vitest";
import { toActivityEntry } from "@/features/applicant/applications/model/activity-labels";
import type { ActivityItem } from "@/features/applicant/applications/api/activity-schema";
import { formatActivityEntry } from "@/features/provider/dashboard/applicant-workflow/activity-label";
import type { WorkspaceActivityItem } from "@/features/provider/dashboard/applicant-workflow/api/workspace";
import { SHARED_ACTIVITY_EVENT_LABEL } from "./event-labels";

function item(type: ActivityItem["type"]): ActivityItem {
  return {
    id: "activity-1",
    type,
    actorType: "SYSTEM",
    occurredAt: "2026-10-27T12:20:00.000Z",
    payload: null,
  };
}

describe("shared activity labels", () => {
  it("uses the same German wording for both audiences and no raw actor enums", () => {
    for (const type of Object.keys(SHARED_ACTIVITY_EVENT_LABEL) as Array<
      keyof typeof SHARED_ACTIVITY_EVENT_LABEL
    >) {
      const label = SHARED_ACTIVITY_EVENT_LABEL[type];
      const applicant = toActivityEntry(item(type));
      const provider = formatActivityEntry(
        item(type) as WorkspaceActivityItem,
        "Maria Schneider",
      );

      expect(applicant.label).toBe(label);
      expect(applicant.label).not.toMatch(/\b(PROVIDER|APPLICANT|SYSTEM)\b/);
      if (type === "CONVERSATION_OPENED") {
        expect(provider).toBeNull();
      } else {
        expect(provider?.text).toBe(`System · ${label}`);
        expect(provider?.text).not.toMatch(/\b(PROVIDER|APPLICANT|SYSTEM)\b/);
      }
    }
  });

  it("keeps audience-specific wording where the catalogs differ", () => {
    const noShow = item("VIEWING_NO_SHOW");
    expect(toActivityEntry(noShow).label).toBe(
      "Besichtigung als nicht wahrgenommen vermerkt",
    );
    expect(
      formatActivityEntry(noShow as WorkspaceActivityItem, "Maria Schneider")
        ?.text,
    ).toBe("System · Nicht erschienen");
  });
});
