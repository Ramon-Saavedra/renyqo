import { render, screen } from "@testing-library/react";
import { Lock } from "lucide-react";
import { describe, expect, it } from "vitest";

import { InfoPill } from "./InfoPill";

describe("InfoPill", () => {
  it("renders its children", () => {
    render(<InfoPill>Welcome</InfoPill>);

    expect(screen.getByText("Welcome")).toBeInstanceOf(HTMLElement);
  });

  it("applies the mono variant by default", () => {
    const { container } = render(<InfoPill>Welcome</InfoPill>);
    const root = container.firstElementChild;

    expect(root?.className).toContain("font-mono");
    expect(root?.className).toContain("uppercase");
  });

  it("applies the body variant when requested", () => {
    const { container } = render(<InfoPill variant="body">Trust</InfoPill>);
    const root = container.firstElementChild;

    expect(root?.className).toContain("text-caption");
    expect(root?.className).not.toContain("font-mono");
  });

  it("renders a pip when withPip is true", () => {
    const { container } = render(<InfoPill withPip>Hello</InfoPill>);
    const pip = container.querySelector("span > span");

    expect(pip?.className).toContain("rounded-full");
    expect(pip?.className).toContain("bg-primary");
  });

  it("renders an icon when provided", () => {
    const { container } = render(<InfoPill icon={Lock}>Trust</InfoPill>);

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });

  it("appends a custom className", () => {
    const { container } = render(
      <InfoPill className="custom-class">Hello</InfoPill>,
    );
    const root = container.firstElementChild;

    expect(root?.className).toContain("custom-class");
  });
});
