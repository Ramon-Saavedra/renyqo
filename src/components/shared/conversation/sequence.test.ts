import { describe, expect, it } from "vitest";
import { inspectLoadedSequences } from "./sequence";

describe("inspectLoadedSequences", () => {
  it("treats an empty thread as a start cursor", () => {
    expect(inspectLoadedSequences([])).toEqual({ kind: "empty" });
  });

  it("returns the highest contiguous sequence", () => {
    expect(
      inspectLoadedSequences([
        { sequence: 2 },
        { sequence: 1 },
        { sequence: 3 },
      ]),
    ).toEqual({ kind: "contiguous", through: 3 });
  });

  it("reports a hole inside the loaded range", () => {
    expect(inspectLoadedSequences([{ sequence: 1 }, { sequence: 3 }])).toEqual({
      kind: "hole",
    });
    expect(inspectLoadedSequences([{ sequence: 2 }])).toEqual({
      kind: "hole",
    });
    expect(inspectLoadedSequences([{ sequence: 1 }, { sequence: 1 }])).toEqual({
      kind: "hole",
    });
  });
});
