import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";

vi.mock("./DashboardTopbar", () => ({
  DashboardTopbar: () => <div />,
}));

describe("DashboardLoadingSkeleton", () => {
  it("renders a waiting queue placeholder", () => {
    render(<DashboardLoadingSkeleton />);

    expect(screen.getByTestId("waiting-queue-skeleton")).not.toBeNull();
  });
});
