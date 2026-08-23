import { describe, expect, it } from "vitest";
import {
  formatArea,
  formatAvailability,
  formatEUR,
  formatRooms,
} from "./format";

describe("formatEUR", () => {
  it("formats whole euros in German locale", () => {
    expect(formatEUR(1200)).toBe("1.200 €");
  });

  it("rounds to the nearest whole euro", () => {
    expect(formatEUR(899.99)).toBe("900 €");
  });

  it("formats zero", () => {
    expect(formatEUR(0)).toBe("0 €");
  });
});

describe("formatArea", () => {
  it("appends m² to the value", () => {
    expect(formatArea(70)).toBe("70 m²");
  });

  it("handles zero", () => {
    expect(formatArea(0)).toBe("0 m²");
  });

  it("groups thousands in German locale", () => {
    expect(formatArea(22222)).toBe("22.222 m²");
  });
});

describe("formatRooms", () => {
  it("returns singular for 1", () => {
    expect(formatRooms(1)).toBe("1 Zimmer");
  });

  it("returns plural for other values", () => {
    expect(formatRooms(3)).toBe("3 Zimmer");
  });

  it("uses the German decimal comma for half rooms", () => {
    expect(formatRooms(2.5)).toBe("2,5 Zimmer");
  });
});

describe("formatAvailability", () => {
  it("returns 'sofort' for null", () => {
    expect(formatAvailability(null)).toBe("sofort");
  });

  it("returns 'sofort' for empty string", () => {
    expect(formatAvailability("")).toBe("sofort");
  });

  it("formats an ISO date in German locale", () => {
    // Use a fixed date that formats consistently.
    const result = formatAvailability("2026-09-01");
    expect(result).toBe("01.09.2026");
  });
});
