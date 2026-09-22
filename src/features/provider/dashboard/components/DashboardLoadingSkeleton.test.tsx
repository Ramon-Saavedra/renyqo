import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";

describe("DashboardLoadingSkeleton", () => {
  it("renders dashboard loading placeholders", () => {
    const { container } = render(<DashboardLoadingSkeleton />);

    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
  });

  it("uses text skeletons for backend content and keeps the loading ring", () => {
    const { container } = render(<DashboardLoadingSkeleton />);
    expect(container.getElementsByClassName("sk-text").length).toBeGreaterThan(
      0,
    );
    expect(container.querySelector(".reveal-wrap")).not.toBeNull();
    expect(
      container.querySelector('section[aria-label="Kürzlich ausgeschieden"]'),
    ).toBeNull();
  });
});
