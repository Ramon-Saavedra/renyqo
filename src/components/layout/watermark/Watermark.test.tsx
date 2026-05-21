import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { Watermark } from "./Watermark";

describe("Watermark", () => {
  it("renders the brand name from site config", () => {
    const { container } = render(<Watermark />);

    expect(container.textContent).toBe(siteConfig.name);
  });

  it("applies the watermark utility class", () => {
    const { container } = render(<Watermark />);
    const span = container.firstElementChild;

    expect(span?.className).toBe("watermark");
  });

  it("is decorative and hidden from assistive tech", () => {
    const { container } = render(<Watermark />);
    const span = container.firstElementChild;

    expect(span?.getAttribute("aria-hidden")).toBe("true");
  });
});
