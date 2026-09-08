import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listingsCopy } from "../copy/listings";
import { AnimatedHeroTitle } from "./AnimatedHeroTitle";

const TITLES = listingsCopy.hero.titles;
const TITLE_CLASS =
  "mb-2.5 max-w-2xl font-display text-heading-xl font-medium text-foreground";

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

function renderTitle() {
  return render(<AnimatedHeroTitle className={TITLE_CLASS} />);
}

function heading() {
  return screen.getByRole("heading", { level: 1, name: TITLES[0] });
}

function sizers() {
  return screen.getByRole("heading", { level: 1 }).nextElementSibling;
}

function visibleTitle() {
  return sizers()?.querySelector("span:not(.invisible)");
}

describe("AnimatedHeroTitle", () => {
  beforeEach(() => {
    window.matchMedia = buildMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes a stable semantic heading with the first title", () => {
    renderTitle();
    expect(heading()).toBeInstanceOf(HTMLHeadingElement);
    expect(heading().className).toContain("sr-only");
  });

  it("keeps the visual rotation hidden from assistive technology", () => {
    renderTitle();
    const stack = sizers();
    expect(stack).toBeInstanceOf(HTMLElement);
    expect(stack?.getAttribute("aria-hidden")).toBe("true");
    for (const title of TITLES) {
      expect(stack?.textContent).toContain(title);
    }
  });

  it("reserves height by stacking all three titles in one grid cell", () => {
    renderTitle();
    const stack = sizers();
    expect(stack?.className).toContain("grid");
    const reserved = [...(stack?.querySelectorAll("span.invisible") ?? [])];
    expect(reserved).toHaveLength(3);
    for (const node of reserved) {
      expect(node.className).toContain("col-start-1");
      expect(node.className).toContain("row-start-1");
      expect(node.className).not.toContain("absolute");
    }
  });

  it("does not rotate when the user prefers reduced motion", async () => {
    window.matchMedia = buildMatchMedia(true);
    vi.useFakeTimers();
    renderTitle();

    expect(visibleTitle()?.textContent).toBe(TITLES[0]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(heading()).toBeInstanceOf(HTMLHeadingElement);
    expect(visibleTitle()?.textContent).toBe(TITLES[0]);
  });

  it("rotates the visual title without changing the semantic heading", async () => {
    vi.useFakeTimers();
    renderTitle();

    expect(visibleTitle()?.textContent).toBe(TITLES[0]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(heading().textContent).toBe(TITLES[0]);
    expect(visibleTitle()?.textContent).toBe(TITLES[1]);
  });
});
