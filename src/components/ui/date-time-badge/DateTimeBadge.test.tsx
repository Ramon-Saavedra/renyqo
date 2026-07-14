import { render, screen } from "@testing-library/react";
import { Clock } from "lucide-react";
import { describe, expect, it } from "vitest";

import { DateTimeBadge } from "./DateTimeBadge";

describe("DateTimeBadge", () => {
  it("renders the provided value and optional title", () => {
    const { container } = render(
      <DateTimeBadge
        value="02.07.2026, 13:00"
        title="Veröffentlicht 02.07.2026, 13:00"
      />,
    );

    expect(screen.getByText("02.07.2026, 13:00")).toBeInstanceOf(HTMLElement);
    expect(container.firstElementChild?.getAttribute("title")).toBe(
      "Veröffentlicht 02.07.2026, 13:00",
    );
  });

  it("renders a decorative icon", () => {
    const { container } = render(
      <DateTimeBadge value="02.07.2026, 13:00" icon={Clock} />,
    );

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });
});
