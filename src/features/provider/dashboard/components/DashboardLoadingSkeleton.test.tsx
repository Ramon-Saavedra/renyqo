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
});
