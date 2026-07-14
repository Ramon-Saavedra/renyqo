import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RotatingBenefits } from "./RotatingBenefits";

const benefits = [
  "Keine wochenlange Funkstille mehr nach deiner Anfrage.",
  "Du siehst vorab, ob ein Mietobjekt wirklich zu deinem Profil passt.",
  "Dein Mietprofil ist vorbereitet, bevor es ernst wird.",
] as const;

function ariaHiddenOf(text: string) {
  return screen.getByText(text).getAttribute("aria-hidden");
}

function buildMatchMedia(reduce: boolean): typeof window.matchMedia {
  return vi.fn().mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("reduce") ? reduce : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  );
}

describe("RotatingBenefits", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    window.matchMedia = buildMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders benefits with only the active one exposed", () => {
    render(<RotatingBenefits benefits={benefits} />);

    expect(ariaHiddenOf(benefits[0])).toBe("false");
    expect(ariaHiddenOf(benefits[1])).toBe("true");
    expect(ariaHiddenOf(benefits[2])).toBe("true");
  });

  it("rotates benefits over time and wraps back to the first", () => {
    render(<RotatingBenefits benefits={benefits} />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(ariaHiddenOf(benefits[1])).toBe("false");

    act(() => {
      vi.advanceTimersByTime(6000 * 2);
    });
    expect(ariaHiddenOf(benefits[0])).toBe("false");
  });

  it("does not rotate when the user prefers reduced motion", () => {
    window.matchMedia = buildMatchMedia(true);
    render(<RotatingBenefits benefits={benefits} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(ariaHiddenOf(benefits[0])).toBe("false");
    expect(ariaHiddenOf(benefits[1])).toBe("true");
  });
});
