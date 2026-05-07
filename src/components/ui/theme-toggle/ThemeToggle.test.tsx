import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "./ThemeToggle";

function getButton() {
  return screen.getByRole("button");
}

function setDarkOnRoot(active: boolean) {
  document.documentElement.classList.toggle("dark", active);
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders a real button with type=button", () => {
      render(<ThemeToggle />);

      expect(getButton().getAttribute("type")).toBe("button");
    });

    it("starts in light mode when the root html lacks the dark class", () => {
      render(<ThemeToggle />);
      const button = getButton();

      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(button.getAttribute("aria-label")).toBe("Switch to dark mode");
    });

    it("starts in dark mode when the root html has the dark class", () => {
      setDarkOnRoot(true);
      render(<ThemeToggle />);
      const button = getButton();

      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
    });

    it("renders the Sun icon in light mode", () => {
      const { container } = render(<ThemeToggle />);

      expect(container.querySelector("svg.lucide-sun")).toBeInstanceOf(
        SVGElement,
      );
      expect(container.querySelector("svg.lucide-moon")).toBeNull();
    });

    it("renders the Moon icon in dark mode", () => {
      setDarkOnRoot(true);
      const { container } = render(<ThemeToggle />);

      expect(container.querySelector("svg.lucide-moon")).toBeInstanceOf(
        SVGElement,
      );
      expect(container.querySelector("svg.lucide-sun")).toBeNull();
    });

    it("renders the icon as decorative", () => {
      const { container } = render(<ThemeToggle />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });

    it("uses the rounded-full base class on the button", () => {
      render(<ThemeToggle />);

      expect(getButton().className).toContain("rounded-full");
    });
  });

  describe("toggling", () => {
    it("adds the dark class to <html> when toggled from light", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes the dark class from <html> when toggled from dark", async () => {
      setDarkOnRoot(true);
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("persists 'dark' to localStorage when switching from light", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());

      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("persists 'light' to localStorage when switching from dark", async () => {
      setDarkOnRoot(true);
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());

      expect(localStorage.getItem("theme")).toBe("light");
    });

    it("flips aria-pressed and aria-label on each click", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());
      expect(getButton().getAttribute("aria-pressed")).toBe("true");
      expect(getButton().getAttribute("aria-label")).toBe(
        "Switch to light mode",
      );

      await user.click(getButton());
      expect(getButton().getAttribute("aria-pressed")).toBe("false");
      expect(getButton().getAttribute("aria-label")).toBe(
        "Switch to dark mode",
      );
    });

    it("swaps the rendered icon after toggling", async () => {
      const user = userEvent.setup();
      const { container } = render(<ThemeToggle />);

      await user.click(getButton());

      expect(container.querySelector("svg.lucide-moon")).toBeInstanceOf(
        SVGElement,
      );
      expect(container.querySelector("svg.lucide-sun")).toBeNull();
    });
  });

  describe("external theme changes", () => {
    it("reacts when the dark class is toggled outside the component", async () => {
      render(<ThemeToggle />);
      expect(getButton().getAttribute("aria-pressed")).toBe("false");

      setDarkOnRoot(true);

      await waitFor(() => {
        expect(getButton().getAttribute("aria-pressed")).toBe("true");
      });
    });
  });

  describe("error handling", () => {
    it("does not throw when localStorage.setItem fails", async () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("quota exceeded");
        });
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(getButton());

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      setItemSpy.mockRestore();
    });
  });
});
