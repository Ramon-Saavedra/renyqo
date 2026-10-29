import { describe, expect, it } from "vitest";
import { berlinLocalToInstant } from "./berlin-instant";

describe("berlin viewing instants", () => {
  it("converts winter and summer wall times to offset instants", () => {
    expect(berlinLocalToInstant("2026-01-15", "16:00")).toBe(
      "2026-01-15T15:00:00.000Z",
    );
    expect(berlinLocalToInstant("2026-07-15", "16:00")).toBe(
      "2026-07-15T14:00:00.000Z",
    );
  });

  it("rejects a wall time that does not exist on the spring-forward day", () => {
    expect(berlinLocalToInstant("2026-03-29", "02:30")).toBeNull();
  });
});
