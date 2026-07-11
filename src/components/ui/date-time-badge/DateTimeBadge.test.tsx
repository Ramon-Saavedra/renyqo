import { render, screen } from "@testing-library/react";
import { Clock } from "lucide-react";
import { describe, expect, it } from "vitest";

import { DateTimeBadge } from "./DateTimeBadge";

describe("DateTimeBadge", () => {
  it("renders the provided value", () => {
    render(<DateTimeBadge value="02.07.2026, 13:00" />);

    expect(screen.getByText("02.07.2026, 13:00")).toBeInstanceOf(HTMLElement);
  });

  it("applies the accent styling", () => {
    const { container } = render(<DateTimeBadge value="02.07.2026, 13:00" />);
    const root = container.firstElementChild;

    expect(root?.className).toContain("bg-primary-tint");
    expect(root?.className).toContain("border-primary-soft");
    expect(root?.className).toContain("text-primary");
  });

  it("uses tabular figures for a stable width", () => {
    const { container } = render(<DateTimeBadge value="02.07.2026, 13:00" />);

    expect(container.firstElementChild?.className).toContain("tabular-nums");
  });

  it("sets the title attribute when provided", () => {
    const { container } = render(
      <DateTimeBadge
        value="02.07.2026, 13:00"
        title="Veröffentlicht 02.07.2026, 13:00"
      />,
    );

    expect(container.firstElementChild?.getAttribute("title")).toBe(
      "Veröffentlicht 02.07.2026, 13:00",
    );
  });

  it("renders an icon", () => {
    const { container } = render(
      <DateTimeBadge value="02.07.2026, 13:00" icon={Clock} />,
    );

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });

  it("appends a custom className", () => {
    const { container } = render(
      <DateTimeBadge value="02.07.2026, 13:00" className="custom-class" />,
    );

    expect(container.firstElementChild?.className).toContain("custom-class");
  });
});
