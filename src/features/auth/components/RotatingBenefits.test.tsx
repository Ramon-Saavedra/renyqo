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

function visibleParagraphs(container: HTMLElement) {
  return Array.from(container.querySelectorAll("p")).filter(
    (p) => p.getAttribute("aria-hidden") === "false",
  );
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

  describe("structure", () => {
    it("renders every benefit as a paragraph", () => {
      render(<RotatingBenefits benefits={benefits} />);

      benefits.forEach((b) => {
        expect(screen.getByText(b)).toBeInstanceOf(HTMLParagraphElement);
      });
    });

    it("marks only the first benefit as visible on initial render", () => {
      const { container } = render(<RotatingBenefits benefits={benefits} />);

      const visible = visibleParagraphs(container);
      expect(visible).toHaveLength(1);
      expect(visible[0]?.textContent).toBe(benefits[0]);
    });

    it("hides the non-active benefits via aria-hidden=true", () => {
      render(<RotatingBenefits benefits={benefits} />);

      expect(ariaHiddenOf(benefits[0])).toBe("false");
      expect(ariaHiddenOf(benefits[1])).toBe("true");
      expect(ariaHiddenOf(benefits[2])).toBe("true");
    });

    it("wraps benefits in a relative container with min-h-12", () => {
      const { container } = render(<RotatingBenefits benefits={benefits} />);

      expect(container.querySelector(".relative.min-h-12")).toBeInstanceOf(
        HTMLElement,
      );
    });
  });

  describe("static cases (no rotation)", () => {
    it("does not rotate when only one benefit is provided", () => {
      render(<RotatingBenefits benefits={["solo"]} />);

      expect(ariaHiddenOf("solo")).toBe("false");

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(ariaHiddenOf("solo")).toBe("false");
    });

    it("does not rotate when the user prefers reduced motion", () => {
      window.matchMedia = buildMatchMedia(true);
      render(<RotatingBenefits benefits={benefits} />);

      expect(ariaHiddenOf(benefits[0])).toBe("false");

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(ariaHiddenOf(benefits[0])).toBe("false");
      expect(ariaHiddenOf(benefits[1])).toBe("true");
    });
  });

  describe("rotation", () => {
    it("advances to the next benefit after ROTATION_INTERVAL (6000ms)", () => {
      render(<RotatingBenefits benefits={benefits} />);
      expect(ariaHiddenOf(benefits[0])).toBe("false");

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(ariaHiddenOf(benefits[0])).toBe("true");
      expect(ariaHiddenOf(benefits[1])).toBe("false");
    });

    it("advances through every benefit in order", () => {
      render(<RotatingBenefits benefits={benefits} />);

      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(ariaHiddenOf(benefits[1])).toBe("false");

      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(ariaHiddenOf(benefits[2])).toBe("false");
    });

    it("wraps back to the first benefit after a full cycle", () => {
      render(<RotatingBenefits benefits={benefits} />);

      act(() => {
        vi.advanceTimersByTime(6000 * benefits.length);
      });

      expect(ariaHiddenOf(benefits[0])).toBe("false");
    });

    it("offsets the initial index by `delay` so two cards stay out of phase", () => {
      render(<RotatingBenefits benefits={benefits} delay={3000} />);
      expect(ariaHiddenOf(benefits[0])).toBe("false");

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(ariaHiddenOf(benefits[1])).toBe("false");
    });
  });

  describe("lifecycle", () => {
    it("clears the rotation interval on unmount", () => {
      const clearSpy = vi.spyOn(window, "clearInterval");
      const { unmount } = render(<RotatingBenefits benefits={benefits} />);

      unmount();

      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it("does not throw when timers fire after unmount", () => {
      const { unmount } = render(<RotatingBenefits benefits={benefits} />);
      unmount();

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(60_000);
        });
      }).not.toThrow();
    });
  });
});
