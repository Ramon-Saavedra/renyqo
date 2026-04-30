import { render } from "@testing-library/react";
import { Home } from "lucide-react";
import { describe, expect, it } from "vitest";

import { AppIcon } from "./AppIcon";

describe("AppIcon", () => {
  describe("rendering", () => {
    it("renders an svg element for the provided lucide icon", () => {
      const { container } = render(<AppIcon icon={Home} />);

      expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
    });
  });

  describe("size", () => {
    it("defaults the rendered size to 16", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("width")).toBe("16");
      expect(svg?.getAttribute("height")).toBe("16");
    });

    it("honors a custom size", () => {
      const { container } = render(<AppIcon icon={Home} size={24} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("width")).toBe("24");
      expect(svg?.getAttribute("height")).toBe("24");
    });
  });

  describe("strokeWidth", () => {
    it("defaults strokeWidth to 1.75", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("stroke-width")).toBe("1.75");
    });

    it("honors a custom strokeWidth", () => {
      const { container } = render(<AppIcon icon={Home} strokeWidth={3} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("stroke-width")).toBe("3");
    });
  });

  describe("accessibility — decorative", () => {
    it("treats the icon as decorative by default (no title)", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("role")).toBeNull();
      expect(svg?.getAttribute("aria-label")).toBeNull();
    });

    it("stays decorative when decorative=true even with a title", () => {
      const { container } = render(
        <AppIcon icon={Home} title="Home" decorative />,
      );
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("role")).toBeNull();
      expect(svg?.getAttribute("aria-label")).toBeNull();
    });
  });

  describe("accessibility — labelled", () => {
    it("becomes a labelled image when a title is provided and decorative is false", () => {
      const { container } = render(<AppIcon icon={Home} title="Startseite" />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("aria-hidden")).toBeNull();
      expect(svg?.getAttribute("role")).toBe("img");
      expect(svg?.getAttribute("aria-label")).toBe("Startseite");
    });
  });

  describe("disabled state", () => {
    it("applies disabled visual classes when disabled", () => {
      const { container } = render(<AppIcon icon={Home} disabled />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("class")).toContain("opacity-50");
      expect(svg?.getAttribute("class")).toContain("pointer-events-none");
    });

    it("omits disabled classes by default", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("class")).not.toContain("opacity-50");
      expect(svg?.getAttribute("class")).not.toContain("pointer-events-none");
    });
  });

  describe("classes", () => {
    it("always includes the shrink-0 base class", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("class")).toContain("shrink-0");
    });

    it("appends a custom className alongside the base classes", () => {
      const { container } = render(
        <AppIcon icon={Home} className="text-foreground" />,
      );
      const svg = container.querySelector("svg");

      expect(svg?.getAttribute("class")).toContain("shrink-0");
      expect(svg?.getAttribute("class")).toContain("text-foreground");
    });

    it("does not leave dangling whitespace in class when no extras are provided", () => {
      const { container } = render(<AppIcon icon={Home} />);
      const className = container.querySelector("svg")?.getAttribute("class") ?? "";

      expect(className).toBe(className.trim());
      expect(className).not.toMatch(/\s\s/);
    });
  });
});
