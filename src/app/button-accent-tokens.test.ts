import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const GLOBALS_CSS = readFileSync(
  resolve(import.meta.dirname, "globals.css"),
  "utf8",
);

const ACCENT_BLOCKS =
  GLOBALS_CSS.match(/\[data-accent="[^"]+"\]\s*\{[^}]+\}/g) ?? [];

describe("button accent tokens in globals.css", () => {
  it("keeps stable global button primary on the root theme", () => {
    expect(GLOBALS_CSS).toMatch(/--button-primary:\s*var\(--primary-default\)/);
    expect(GLOBALS_CSS).toMatch(/--button-primary-hover:\s*#40536f/);
  });

  it("scopes accent fills to dashboard button tokens without overriding global button primary", () => {
    expect(ACCENT_BLOCKS.length).toBeGreaterThan(0);

    for (const block of ACCENT_BLOCKS) {
      expect(block).toMatch(/--dashboard-button-primary:/);
      expect(block).toMatch(/--dashboard-button-primary-hover:/);
      expect(block).not.toMatch(/--button-primary:/);
      expect(block).not.toMatch(/--button-primary-hover:/);
    }
  });
});
