import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";

describe("DashboardLoadingSkeleton", () => {
  it("renders the prepare label and a single vertical-sweep veil", () => {
    const { container } = render(<DashboardLoadingSkeleton />);

    expect(screen.getByText("Dashboard wird vorbereitet …")).toBeInstanceOf(
      HTMLElement,
    );
    expect(container.querySelectorAll(".reveal-wrap")).toHaveLength(1);
    expect(container.querySelector(".veil.veil-v")).toBeInstanceOf(HTMLElement);
  });
});
