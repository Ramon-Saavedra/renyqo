import { describe, expect, it } from "vitest";
import { formatActivityEntry } from "./activity-label";
import type { WorkspaceActivityItem } from "./api/workspace";

function item(
  type: WorkspaceActivityItem["type"],
  actorType: WorkspaceActivityItem["actorType"],
  documentType?: "SCHUFA",
): WorkspaceActivityItem {
  return {
    id: "activity-1",
    type,
    actorType,
    occurredAt: "2026-10-04T11:58:44.072Z",
    payload: documentType === undefined ? null : { documentType },
  };
}

describe("formatActivityEntry", () => {
  it("maps a document request to German copy, du, and a formatted time", () => {
    expect(
      formatActivityEntry(
        item("DOCUMENT_REQUESTED", "PROVIDER", "SCHUFA"),
        "Maria Schneider",
      ),
    ).toEqual({
      text: "Du · SCHUFA-Auskunft angefordert",
      dateLabel: "04.10.2026 · 13:58",
    });
  });

  it("labels a later document round as a replacement request", () => {
    expect(
      formatActivityEntry(
        item("DOCUMENT_REQUESTED", "PROVIDER", "SCHUFA"),
        "Maria Schneider",
        5,
      )?.text,
    ).toBe("Du · SCHUFA-Auskunft erneut angefordert");
  });

  it("omits the technical conversation-opened event from the compact timeline", () => {
    expect(
      formatActivityEntry(
        item("CONVERSATION_OPENED", "PROVIDER"),
        "Maria Schneider",
      ),
    ).toBeNull();
  });

  it("uses the applicant name for an incoming message", () => {
    expect(
      formatActivityEntry(item("MESSAGE_SENT", "APPLICANT"), "Maria Schneider")
        ?.text,
    ).toBe("Maria Schneider · Antwort eingegangen");
  });
});
