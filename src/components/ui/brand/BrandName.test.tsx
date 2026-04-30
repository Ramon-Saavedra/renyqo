import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandName, withBrand } from "./BrandName";

describe("BrandName", () => {
  describe("rendering", () => {
    it("renders the literal brand text", () => {
      render(<BrandName />);

      expect(screen.getByText("renyqo")).toBeInstanceOf(HTMLSpanElement);
    });

    it("uses a span element", () => {
      const { container } = render(<BrandName />);

      expect(container.querySelector("span")).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe("styling", () => {
    it("applies the bold weight class", () => {
      render(<BrandName />);
      const span = screen.getByText("renyqo");

      expect(span.className).toContain("font-bold");
    });

    it("applies the primary color token class", () => {
      render(<BrandName />);
      const span = screen.getByText("renyqo");

      expect(span.className).toContain("text-primary");
    });
  });
});

describe("withBrand", () => {
  describe("placeholder substitution", () => {
    it("replaces a single {brand} token with the BrandName component", () => {
      const { container } = render(<>{withBrand("Willkommen bei {brand}")}</>);

      expect(container.textContent).toBe("Willkommen bei renyqo");
      expect(container.querySelectorAll("span")).toHaveLength(1);
    });

    it("replaces every {brand} token when more than one is present", () => {
      const { container } = render(
        <>{withBrand("{brand} liebt dich, und du liebst {brand}")}</>,
      );

      expect(container.textContent).toBe(
        "renyqo liebt dich, und du liebst renyqo",
      );
      expect(container.querySelectorAll("span")).toHaveLength(2);
    });

    it("renders BrandName at the very start when the template begins with {brand}", () => {
      const { container } = render(<>{withBrand("{brand} ist da")}</>);

      expect(container.textContent).toBe("renyqo ist da");
      expect(container.querySelectorAll("span")).toHaveLength(1);
    });

    it("renders BrandName at the very end when the template ends with {brand}", () => {
      const { container } = render(<>{withBrand("Willkommen bei {brand}")}</>);

      expect(container.textContent?.endsWith("renyqo")).toBe(true);
    });

    it("renders consecutive BrandNames when two tokens are adjacent", () => {
      const { container } = render(<>{withBrand("{brand}{brand}")}</>);

      expect(container.textContent).toBe("renyqorenyqo");
      expect(container.querySelectorAll("span")).toHaveLength(2);
    });
  });

  describe("templates without placeholders", () => {
    it("returns the template text unchanged when no {brand} token is present", () => {
      const { container } = render(<>{withBrand("Reine Textzeile")}</>);

      expect(container.textContent).toBe("Reine Textzeile");
      expect(container.querySelector("span")).toBeNull();
    });

    it("renders nothing visible for an empty template", () => {
      const { container } = render(<>{withBrand("")}</>);

      expect(container.textContent).toBe("");
      expect(container.querySelector("span")).toBeNull();
    });
  });

  describe("BrandName styling within withBrand output", () => {
    it("applies the BrandName classes to each substituted token", () => {
      const { container } = render(<>{withBrand("Hallo {brand}")}</>);
      const span = container.querySelector("span");

      expect(span?.className).toContain("font-bold");
      expect(span?.className).toContain("text-primary");
    });
  });
});
