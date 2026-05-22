import { describe, expect, it } from "vitest";

import { formatArea, formatEUR, formatRelative } from "./format";

describe("formatEUR", () => {
  it("formats integers as German EUR currency without decimals", () => {
    const result = formatEUR(1480);
    expect(result).toContain("1.480");
    expect(result).toContain("€");
  });

  it("formats zero", () => {
    expect(formatEUR(0)).toContain("0");
  });
});

describe("formatArea", () => {
  it("renders square meters with the unit suffix", () => {
    expect(formatArea(84)).toBe("84 m²");
  });
});

describe("formatRelative", () => {
  const NOW = new Date("2026-05-22T15:00:00");

  it("returns 'gerade eben' for sub-minute differences", () => {
    expect(formatRelative("2026-05-22T14:59:30", NOW)).toBe("gerade eben");
  });

  it("returns minutes for sub-hour differences", () => {
    expect(formatRelative("2026-05-22T14:01:00", NOW)).toBe("vor 59 Min.");
    expect(formatRelative("2026-05-22T14:42:00", NOW)).toBe("vor 18 Min.");
  });

  it("returns hours for sub-day differences", () => {
    expect(formatRelative("2026-05-22T07:00:00", NOW)).toBe("vor 8 Std.");
  });

  it("returns days for sub-week differences", () => {
    expect(formatRelative("2026-05-19T15:00:00", NOW)).toBe("vor 3 Tagen");
  });

  it("returns a localized date for older entries", () => {
    const result = formatRelative("2026-03-10T08:00:00", NOW);
    expect(result).toMatch(/\d{2}\./);
  });

  it("clamps future timestamps to 'gerade eben'", () => {
    expect(formatRelative("2026-05-22T16:00:00", NOW)).toBe("gerade eben");
  });
});
