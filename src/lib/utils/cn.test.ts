import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns the single class when one is provided", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("ignores false values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("ignores null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("ignores undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("handles all falsy values in a single call", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles a mix of truthy and all falsy types", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
