import { CalendarClock, FileUp } from "lucide-react";
import { describe, expect, it } from "vitest";
import { applicationsCopy } from "../copy";
import { presentNextSteps, type NextStepItem } from "./pending-actions";

const copy = applicationsCopy.nextStep;

function uploadStep(id: string): NextStepItem {
  return {
    key: `UPLOAD_REQUESTED_DOCUMENT:${id}`,
    icon: FileUp,
    title: copy.upload.title("Doc"),
    text: copy.upload.fallbackText,
    cta: copy.upload.navigateCta,
    area: "documents",
    intent: { kind: "upload", requestId: id },
  };
}

function viewingStep(): NextStepItem {
  return {
    key: "RESPOND_TO_VIEWING:viewing-1",
    icon: CalendarClock,
    title: copy.viewing.title,
    text: copy.viewing.fallbackText,
    cta: copy.viewing.cta,
    area: "viewing",
    intent: { kind: "show-viewing" },
  };
}

describe("presentNextSteps", () => {
  it("keeps backend order when collapsing uploads into one aggregate step", () => {
    const presented = presentNextSteps([
      viewingStep(),
      uploadStep("a"),
      uploadStep("b"),
    ]);

    expect(presented.map((item) => item.key)).toEqual([
      "RESPOND_TO_VIEWING:viewing-1",
      "UPLOAD_REQUESTED_DOCUMENT:aggregate",
    ]);
    expect(presented[1]?.title).toBe(copy.upload.aggregateTitle);
    expect(presented[1]?.text).toContain("2");
  });

  it("places the upload aggregate at the first upload position", () => {
    const presented = presentNextSteps([
      uploadStep("a"),
      viewingStep(),
      uploadStep("b"),
    ]);

    expect(presented.map((item) => item.key)).toEqual([
      "UPLOAD_REQUESTED_DOCUMENT:aggregate",
      "RESPOND_TO_VIEWING:viewing-1",
    ]);
  });
});
