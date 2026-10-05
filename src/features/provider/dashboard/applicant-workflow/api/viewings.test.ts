import { describe, expect, it } from "vitest";
import { formatWorkflowTimestamp } from "../format-timestamp";
import { viewingInterval } from "./viewings";

describe("viewingInterval", () => {
  it("keeps Berlin wall time across the spring daylight-time change", () => {
    expect(
      viewingInterval({ date: "2026-03-29", time: "01:30" })?.startsAt,
    ).toBe("2026-03-29T00:30:00.000Z");
    expect(
      viewingInterval({ date: "2026-03-29", time: "03:30" })?.startsAt,
    ).toBe("2026-03-29T01:30:00.000Z");
    expect(viewingInterval({ date: "2026-03-29", time: "02:30" })).toBeNull();
  });

  it("keeps a repeated autumn wall time in Berlin", () => {
    const interval = viewingInterval({ date: "2026-10-25", time: "02:30" });
    expect(interval).not.toBeNull();
    expect(formatWorkflowTimestamp(interval?.startsAt ?? "")).toBe(
      "25.10.2026 · 02:30",
    );
  });
});
