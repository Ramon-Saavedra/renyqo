import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandName, withBrand } from "./BrandName";

describe("BrandName", () => {
  it("renders the brand text", () => {
    render(<BrandName />);

    expect(screen.getByText("Renyqo")).toBeInstanceOf(HTMLSpanElement);
  });
});

describe("withBrand", () => {
  it("replaces brand placeholders with BrandName output", () => {
    const { container } = render(
      <>{withBrand("{brand} liebt dich, und du liebst {brand}")}</>,
    );

    expect(container.textContent).toBe(
      "Renyqo liebt dich, und du liebst Renyqo",
    );
    expect(container.querySelectorAll("span")).toHaveLength(2);
  });

  it("returns plain text when no brand placeholder is present", () => {
    const { container } = render(<>{withBrand("Reine Textzeile")}</>);

    expect(container.textContent).toBe("Reine Textzeile");
    expect(container.querySelector("span")).toBeNull();
  });
});
