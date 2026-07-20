import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "./ScrollToTop";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
}

describe("ScrollToTop", () => {
  beforeEach(() => {
    setScrollY(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stays hidden until the page has been scrolled", () => {
    render(<ScrollToTop />);

    expect(screen.queryByRole("button", { name: "Nach oben" })).toBeNull();
  });

  it("appears after passing the scroll threshold", () => {
    render(<ScrollToTop />);

    act(() => {
      setScrollY(361);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByRole("button", { name: "Nach oben" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("scrolls to the top with smooth behavior", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    setScrollY(500);
    render(<ScrollToTop />);

    await user.click(screen.getByRole("button", { name: "Nach oben" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("uses instant behavior when reduced motion is preferred", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    setScrollY(500);
    render(<ScrollToTop />);

    await user.click(screen.getByRole("button", { name: "Nach oben" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});
