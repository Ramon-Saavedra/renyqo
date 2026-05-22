import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicationsMeter } from "./ApplicationsMeter";

describe("ApplicationsMeter", () => {
  it("renders `APPLICATIONS_MAX` icon slots", () => {
    const { container } = render(<ApplicationsMeter active={3} />);
    const icons = container.querySelectorAll("svg[aria-hidden='true']");
    expect(icons).toHaveLength(5);
  });

  it("applies active color to the filled icons", () => {
    const { container } = render(<ApplicationsMeter active={3} />);
    const icons = container.querySelectorAll("svg[aria-hidden='true']");
    const active = Array.from(icons).filter((el) =>
      el.classList.contains("text-success-vivid"),
    );
    expect(active).toHaveLength(3);
  });

  it("renders an accessible label with current count", () => {
    render(<ApplicationsMeter active={2} />);
    expect(
      screen.getByRole("img", { name: "2 von 5 aktiven Bewerbungen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders zero active icons when active is 0", () => {
    const { container } = render(<ApplicationsMeter active={0} />);
    const active = Array.from(
      container.querySelectorAll("svg[aria-hidden='true']"),
    ).filter((el) => el.classList.contains("text-success-vivid"));
    expect(active).toHaveLength(0);
  });
});
