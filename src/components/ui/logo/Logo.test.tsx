import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./Logo";

describe("Logo", () => {
  describe("brand text", () => {
    it("renders the literal brand label", () => {
      render(<Logo />);

      expect(screen.getByText("Renyqo")).toBeInstanceOf(HTMLElement);
    });
  });

  describe("icon", () => {
    it("renders an svg icon inside the badge", () => {
      const { container } = render(<Logo />);

      expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
    });

    it("marks the icon as decorative for assistive tech", () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("role")).toBeNull();
    });
  });

  describe("structure", () => {
    it("wraps the icon in a primary-colored badge container", () => {
      const { container } = render(<Logo />);
      const badge = container.querySelector("span > span");

      expect(badge).toBeInstanceOf(HTMLSpanElement);
      expect(badge?.className).toContain("bg-primary");
      expect(badge?.className).toContain("text-primary-foreground");
    });

    it("places the badge before the brand text", () => {
      const { container } = render(<Logo />);
      const root = container.firstElementChild;
      const firstChild = root?.firstElementChild;

      expect(firstChild?.tagName).toBe("SPAN");
      expect(firstChild?.querySelector("svg")).toBeInstanceOf(SVGElement);
      expect(root?.textContent).toContain("Renyqo");
    });
  });

  describe("base classes", () => {
    it("applies the display font and brand text-size classes by default", () => {
      const { container } = render(<Logo />);
      const root = container.firstElementChild;

      expect(root?.className).toContain("font-display");
      expect(root?.className).toContain("text-brand");
      expect(root?.className).toContain("font-semibold");
    });
  });

  describe("className prop", () => {
    it("appends a custom className to the base classes", () => {
      const { container } = render(<Logo className="ml-4" />);
      const root = container.firstElementChild;

      expect(root?.className).toContain("font-display");
      expect(root?.className).toContain("ml-4");
    });

    it("uses only the base classes when no className is provided", () => {
      const { container } = render(<Logo />);
      const root = container.firstElementChild;

      expect(root?.className).not.toMatch(/\s\s/);
      expect(root?.className.trim()).toBe(root?.className);
    });
  });
});
