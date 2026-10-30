import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";

describe("DashboardLoadingSkeleton", () => {
  it("renders dashboard loading placeholders", () => {
    const { container } = render(<DashboardLoadingSkeleton />);

    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
    const actions = container.querySelector(".ml-auto");
    const blocks = actions?.querySelectorAll(":scope > .sk");
    expect(blocks?.[0]?.className).toContain("lg:w-40");
    expect(blocks?.[0]?.className).not.toContain("sm:min-w-16");
    expect(blocks?.[1]?.className).toContain("sm:w-48");
    expect(actions?.querySelector(".border-l .sk-circle")).not.toBeNull();
    expect(actions?.querySelector(".border-l .gap-2\\.5")).not.toBeNull();
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
