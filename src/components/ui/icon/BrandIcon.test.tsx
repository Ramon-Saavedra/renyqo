import { render, screen } from "@testing-library/react";
import { SiGithub } from "react-icons/si";
import { describe, expect, it } from "vitest";

import { BrandIcon } from "./BrandIcon";

describe("BrandIcon", () => {
  it("renders an svg element", () => {
    const { container } = render(<BrandIcon icon={SiGithub} decorative />);

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });

  it("applies aria-hidden when decorative is true", () => {
    const { container } = render(<BrandIcon icon={SiGithub} decorative />);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("applies aria-hidden when neither decorative nor title is provided", () => {
    const { container } = render(<BrandIcon icon={SiGithub} />);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("applies aria-label and role img when title is provided", () => {
    render(<BrandIcon icon={SiGithub} title="GitHub" />);

    expect(screen.getByRole("img", { name: "GitHub" })).toBeInstanceOf(
      SVGElement,
    );
  });

  it("applies custom className alongside base class", () => {
    const { container } = render(
      <BrandIcon icon={SiGithub} decorative className="text-primary" />,
    );
    const svg = container.querySelector("svg");

    expect(svg?.className.baseVal).toContain("shrink-0");
    expect(svg?.className.baseVal).toContain("text-primary");
  });

  it("defaults size to 16", () => {
    const { container } = render(<BrandIcon icon={SiGithub} decorative />);

    expect(container.querySelector("svg")?.getAttribute("width")).toBe("16");
  });

  it("forwards a custom size", () => {
    const { container } = render(
      <BrandIcon icon={SiGithub} size={24} decorative />,
    );

    expect(container.querySelector("svg")?.getAttribute("width")).toBe("24");
  });
});
