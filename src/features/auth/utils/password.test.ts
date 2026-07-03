import { describe, expect, it } from "vitest";

import {
  generateSecurePassword,
  getPasswordStrength,
} from "./password";

describe("getPasswordStrength", () => {
  it("returns null for an empty string", () => {
    expect(getPasswordStrength("")).toBeNull();
  });

  it("returns schwach for a string shorter than 8 characters", () => {
    expect(getPasswordStrength("abc")).toBe("schwach");
    expect(getPasswordStrength("1234567")).toBe("schwach");
  });

  it("considers exactly 8 characters as not schwach", () => {
    expect(getPasswordStrength("abcdefgh")).not.toBe("schwach");
  });

  it("returns mittel for 8+ chars with fewer than 3 character types", () => {
    expect(getPasswordStrength("abcdefgh")).toBe("mittel");
    expect(getPasswordStrength("abcdefg1")).toBe("mittel");
    expect(getPasswordStrength("ABCDEFG1")).toBe("mittel");
  });

  it("returns stark for 8+ chars with 3 or more character types", () => {
    expect(getPasswordStrength("Abcdefg1")).toBe("stark");
    expect(getPasswordStrength("Abcdef1!")).toBe("stark");
  });
});

describe("generateSecurePassword", () => {
  it("returns a string of exactly 16 characters", () => {
    expect(generateSecurePassword()).toHaveLength(16);
  });

  it("contains at least one lowercase letter", () => {
    expect(/[a-z]/.test(generateSecurePassword())).toBe(true);
  });

  it("contains at least one uppercase letter", () => {
    expect(/[A-Z]/.test(generateSecurePassword())).toBe(true);
  });

  it("contains at least one digit", () => {
    expect(/[0-9]/.test(generateSecurePassword())).toBe(true);
  });

  it("contains at least one symbol from the allowed set", () => {
    expect(/[!@#$%^&*\-_=+?.]/.test(generateSecurePassword())).toBe(true);
  });

  it("qualifies as stark according to getPasswordStrength", () => {
    expect(getPasswordStrength(generateSecurePassword())).toBe("stark");
  });

  it("produces different values on repeated calls", () => {
    const results = Array.from({ length: 10 }, generateSecurePassword);
    expect(new Set(results).size).toBeGreaterThan(1);
  });
});
