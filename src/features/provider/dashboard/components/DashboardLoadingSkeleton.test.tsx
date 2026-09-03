import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";

vi.mock("./DashboardTopbar", () => ({
  DashboardTopbar: () => <div />,
}));

describe("DashboardLoadingSkeleton", () => {
  it("renders dashboard loading placeholders", () => {
    const { container } = render(<DashboardLoadingSkeleton />);

    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
  });

  it("includes recent-exit placeholders without the outer loading ring", () => {
    const { container } = render(<DashboardLoadingSkeleton />);

    const recentExitsSkeleton = container.querySelector(
      'section[aria-label="Kürzlich ausgeschieden"]',
    );

    expect(recentExitsSkeleton).toBeInstanceOf(HTMLElement);
    expect(
      recentExitsSkeleton?.getElementsByClassName("sk-circle").length,
    ).toBe(5);
    expect(
      container
        .querySelector(".reveal-wrap")
        ?.classList.contains("reveal-ring"),
    ).toBe(false);
  });
});
