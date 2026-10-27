import { describe, expect, it, vi } from "vitest";
import type { NotificationItem } from "../api/schema";
import { groupNotifications } from "./group";
import { notificationHref } from "./href";
import { notificationLabel } from "./labels";

const AT = "2026-10-26T08:00:00.000Z";

function notification(
  id: string,
  listingId: string,
  applicationId: string,
  type = "VIEWING_PROPOSED",
): NotificationItem {
  return {
    id,
    type,
    category: "VIEWING",
    schemaVersion: 1,
    occurredAt: AT,
    createdAt: AT,
    readAt: null,
    expiresAt: "2027-01-24T08:00:00.000Z",
    target: {
      applicationId,
      listingId,
      workflowId: null,
      proposalId: null,
      appointmentId: null,
      section: "VIEWING",
      activityId: `${id}-activity`,
      action: "OPEN_HISTORY",
    },
  };
}

describe("notification labels", () => {
  it("uses inbox wording for a known type", () => {
    expect(notificationLabel("VIEWING_PROPOSED")).toBe("Neuer Terminvorschlag");
    expect(notificationLabel("APPLICATION_REJECTED")).toBe(
      "Bewerbung abgelehnt",
    );
  });

  it("hides an unknown type behind a neutral label", () => {
    expect(notificationLabel("VIEWING_NOT_A_REAL_TYPE")).toBe(
      "Neue Benachrichtigung",
    );
    expect(notificationLabel("VIEWING_NOT_A_REAL_TYPE")).not.toContain(
      "VIEWING_NOT_A_REAL_TYPE",
    );
  });
});

describe("notification grouping", () => {
  it("groups by listing and then application without fetching titles", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const groups = groupNotifications([
      notification("n1", "listing-1", "application-1", "VIEWING_PROPOSED"),
      notification("n2", "listing-1", "application-2", "VIEWING_ACCEPTED"),
      notification("n3", "listing-1", "application-1", "VIEWING_CANCELLED"),
      notification("n4", "listing-2", "application-3", "APPLICATION_REJECTED"),
    ]);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(groups.map((group) => group.listingId)).toEqual([
      "listing-1",
      "listing-2",
    ]);
    expect(groups[0]?.label).toBe("Inserat");
    expect(groups[0]?.applications.map((group) => group.applicationId)).toEqual(
      ["application-1", "application-2"],
    );
    expect(groups[0]?.applications[0]?.items.map((item) => item.id)).toEqual([
      "n1",
      "n3",
    ]);
    expect(groups[1]?.applications[0]?.items.map((item) => item.id)).toEqual([
      "n4",
    ]);
    fetchSpy.mockRestore();
  });

  it("uses a label that is already known and stays neutral otherwise", () => {
    const groups = groupNotifications(
      [notification("n1", "listing-1", "application-1")],
      new Map([["listing-9", "Anderes Inserat"]]),
    );
    expect(groups[0]?.label).toBe("Inserat");

    const labeled = groupNotifications(
      [notification("n1", "listing-1", "application-1")],
      new Map([["listing-1", "Haus in Bawinkel"]]),
    );
    expect(labeled[0]?.label).toBe("Haus in Bawinkel");
  });
});

describe("notification navigation seam", () => {
  const target = notification("n1", "listing-1", "application-1").target;

  it("opens the applicant viewing history from the stored target", () => {
    expect(notificationHref("applicant", target)).toBe(
      "/applicant/applications/application-1?section=viewing&activityId=n1-activity",
    );
  });

  it("opens the provider application history without an applicant name", () => {
    const href = notificationHref("provider", target);
    const url = new URL(href, "http://localhost");
    expect(url.pathname).toBe("/provider/applications/application-1");
    expect(url.searchParams.get("listingId")).toBe("listing-1");
    expect(url.searchParams.get("applicationId")).toBeNull();
    expect(url.searchParams.get("section")).toBe("viewing");
    expect(url.searchParams.get("activityId")).toBe("n1-activity");
    expect(href).not.toContain("name");
  });
});
