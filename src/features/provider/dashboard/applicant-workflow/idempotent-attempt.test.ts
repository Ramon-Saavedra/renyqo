import { describe, expect, it } from "vitest";
import {
  samePayloadAttempt,
  viewingAttemptSignature,
} from "./idempotent-attempt";

describe("samePayloadAttempt", () => {
  it("keeps the key when the payload is unchanged", () => {
    const current = { signature: "same", key: "key-1" };
    expect(samePayloadAttempt(current, "same", () => "key-2")).toBe(current);
  });

  it("creates a key when the payload changes", () => {
    const current = { signature: "old", key: "key-1" };
    expect(samePayloadAttempt(current, "new", () => "key-2")).toEqual({
      signature: "new",
      key: "key-2",
    });
  });

  it("includes the viewing id in a reschedule signature", () => {
    expect(
      viewingAttemptSignature("viewing-1", "2026-11-04", "18:00"),
    ).not.toBe(viewingAttemptSignature("viewing-2", "2026-11-04", "18:00"));
    expect(viewingAttemptSignature(null, "2026-11-04", "18:00")).not.toBe(
      viewingAttemptSignature(null, "2026-11-04", "18:30"),
    );
  });
});
