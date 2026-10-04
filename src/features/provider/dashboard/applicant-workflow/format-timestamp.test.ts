import { describe, expect, it } from "vitest";
import { formatWorkflowTimestamp } from "./format-timestamp";

describe("formatWorkflowTimestamp", () => {
  it("formats UTC timestamps in the application timezone without seconds", () => {
    expect(formatWorkflowTimestamp("2026-10-04T11:58:44.072Z")).toBe(
      "04.10.2026 · 13:58",
    );
  });

  it("keeps Berlin daylight time before the October fallback", () => {
    expect(formatWorkflowTimestamp("2026-07-15T16:00:00.000Z")).toBe(
      "15.07.2026 · 18:00",
    );
    expect(formatWorkflowTimestamp("2026-10-24T22:30:00.000Z")).toBe(
      "25.10.2026 · 00:30",
    );
  });

  it("uses standard Berlin time after the October fallback", () => {
    expect(formatWorkflowTimestamp("2026-10-25T01:30:00.000Z")).toBe(
      "25.10.2026 · 02:30",
    );
    expect(formatWorkflowTimestamp("2026-10-28T17:00:00.000Z")).toBe(
      "28.10.2026 · 18:00",
    );
    expect(formatWorkflowTimestamp("2026-11-04T11:58:00.000Z")).toBe(
      "04.11.2026 · 12:58",
    );
  });

  it("follows the March daylight-time change in Berlin", () => {
    expect(formatWorkflowTimestamp("2026-03-29T00:30:00.000Z")).toBe(
      "29.03.2026 · 01:30",
    );
    expect(formatWorkflowTimestamp("2026-03-29T01:30:00.000Z")).toBe(
      "29.03.2026 · 03:30",
    );
  });

  it("returns an empty label for a value that is not a timestamp", () => {
    expect(formatWorkflowTimestamp("not-a-date")).toBe("");
  });
});
