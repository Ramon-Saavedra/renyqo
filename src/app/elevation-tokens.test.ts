import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "globals.css"), "utf8");
const light = css.match(/^:root\s*\{([\s\S]*?)\n\}/m)?.[1] ?? "";
const dark = css.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

describe("elevation tokens", () => {
  it("uses one app shadow family with a softer light and brighter dark treatment", () => {
    expect(css).toContain("--shadow-card: var(--card-shadow)");
    const intensity = /--card-shadow:[^;]*var\(--primary-default\)\s+(\d+)%/;
    const lightIntensity = Number(light.match(intensity)?.[1]);
    const darkIntensity = Number(dark.match(intensity)?.[1]);
    expect(lightIntensity).toBeGreaterThan(0);
    expect(darkIntensity).toBeGreaterThan(lightIntensity);
    expect(darkIntensity).toBeLessThan(100);
    expect(
      [...css.matchAll(/--shadow-([\w-]+):/g)].map((match) => match[1]).sort(),
    ).toEqual(["card", "cover-ring", "focus", "tint-ring"]);
    expect(css).not.toMatch(
      /--(?:popup-elevation|shadow-popup|card-shadow-hover|shadow-card-hover):/,
    );
    for (const block of css.match(/\[data-accent="[^"]+"\]\s*\{[^}]+\}/g) ??
      []) {
      expect(block).not.toMatch(/--(?:card-shadow|shadow-card):/);
    }
  });

  it("uses the app shadow only on hover for the photo drop zone", () => {
    const photoCss = readFileSync(
      resolve(
        import.meta.dirname,
        "../features/provider/create-listing/style.css",
      ),
      "utf8",
    );
    expect(photoCss.match(/\.photo-drop\s*\{[^}]*\}/)?.[0]).not.toContain(
      "box-shadow",
    );
    expect(photoCss).toMatch(
      /\.photo-drop:hover\s*\{[^}]*box-shadow:\s*var\(--card-shadow\)/,
    );
    expect(photoCss).toMatch(
      /\.photo-drop:focus-visible\s*\{[^}]*box-shadow:\s*var\(--focus-ring\)/,
    );
  });

  it("keeps elevation off the explicitly excluded surfaces", () => {
    for (const name of [
      "components/layout/scroll-to-top/ScrollToTop.tsx",
      "components/ui/confirmation-modal/ConfirmationModal.tsx",
      "components/ui/toast/FlashToast.tsx",
      "features/auth/components/RoleCard.tsx",
      "features/applicant/listings/components/FilterDrawer.tsx",
      "features/applicant/listings/components/MatchBadge.tsx",
      "features/applicant/listings/components/detail/ListingReportDialog.tsx",
      "features/provider/create-listing/components/AiCaptureSection.tsx",
      "features/provider/dashboard/components/ApplicantPreviewModal.tsx",
      "features/provider/dashboard/components/ListingApplicantSlots.tsx",
      "features/provider/dashboard/components/FlagChip.tsx",
      "features/provider/dashboard/components/SelectedObjectCard.tsx",
      "features/provider/dashboard/components/ShareButtons.tsx",
      "features/provider/dashboard/applicant-workflow/components/ApplicantWorkflowModal.tsx",
    ]) {
      expect(
        readFileSync(resolve(import.meta.dirname, "..", name), "utf8"),
        name,
      ).not.toContain("shadow-card");
    }
  });

  it("keeps focus and selection rings independent of elevation", () => {
    expect(css).toContain("--shadow-focus: var(--focus-ring)");
    expect(css).toContain("--shadow-tint-ring: 0 0 0 3px var(--primary-tint)");
    expect(css).toContain(
      "--shadow-cover-ring: inset 0 0 0 1.5px var(--primary)",
    );
    expect(light).toContain("--focus-ring: 0 0 0 3px rgb(83 103 131 / 0.18)");
    expect(dark).toContain("--focus-ring: 0 0 0 3px rgb(83 103 131 / 0.25)");
  });

  it("isolates AI decoration from the element's keyboard focus shadow", () => {
    expect(css).toMatch(/\.ai-glow::before\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toContain(".ai-glow:focus-visible::before");
    expect(css).not.toMatch(/\.ai-glow:focus-visible\s*\{/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.ai-glow:focus-visible::before\s*\{\s*animation: none/,
    );
  });
});
