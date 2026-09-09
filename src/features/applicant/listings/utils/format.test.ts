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

  it("formats a date-only ISO value on the local calendar day", () => {
    expect(formatAvailability("2026-09-01")).toBe("01.09.2026");
  });

  it("does not shift a date-only value through UTC midnight parsing", () => {
    const utcParsed = new Date("2026-01-01");
    const utcFormatted = new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(utcParsed);
    expect(formatAvailability("2026-01-01")).toBe("01.01.2026");
    if (utcFormatted !== "01.01.2026") {
      expect(formatAvailability("2026-01-01")).not.toBe(utcFormatted);
    }
  });

  it("formats an ISO datetime through the Date parser", () => {
    expect(formatAvailability("2026-07-01T10:00:00.000Z")).toMatch(
      /^\d{2}\.\d{2}\.\d{4}$/,
    );
  });
});
