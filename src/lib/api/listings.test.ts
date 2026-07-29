import { describe, expect, it } from "vitest";

import {
  normalizeObjectType,
  OBJECT_TYPE_LABEL,
  type ObjectTypeBackend,
} from "./listings";

describe("normalizeObjectType", () => {
  it("returns the uppercase backend value for valid input", () => {
    expect(normalizeObjectType("APARTMENT")).toBe("APARTMENT");
    expect(normalizeObjectType("HOUSE")).toBe("HOUSE");
    expect(normalizeObjectType("ROOM")).toBe("ROOM");
  });

  it("normalizes lowercase and mixed-case input", () => {
    expect(normalizeObjectType("apartment")).toBe("APARTMENT");
    expect(normalizeObjectType("house")).toBe("HOUSE");
    expect(normalizeObjectType("Room")).toBe("ROOM");
  });

  it("returns null for unknown values", () => {
    expect(normalizeObjectType("studio")).toBeNull();
    expect(normalizeObjectType("")).toBeNull();
    expect(normalizeObjectType("UNKNOWN")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(normalizeObjectType(null)).toBeNull();
  });
});

describe("OBJECT_TYPE_LABEL", () => {
  it("has a German label for every ObjectTypeBackend key", () => {
    const keys: readonly ObjectTypeBackend[] = ["APARTMENT", "HOUSE", "ROOM"];

    for (const key of keys) {
      expect(OBJECT_TYPE_LABEL).toHaveProperty(key);
      expect(typeof OBJECT_TYPE_LABEL[key]).toBe("string");
      expect(OBJECT_TYPE_LABEL[key].length).toBeGreaterThan(0);
    }
  });

  it("maps each type to the expected German label", () => {
    expect(OBJECT_TYPE_LABEL.APARTMENT).toBe("Wohnung");
    expect(OBJECT_TYPE_LABEL.HOUSE).toBe("Haus");
    expect(OBJECT_TYPE_LABEL.ROOM).toBe("Zimmer");
  });
});
