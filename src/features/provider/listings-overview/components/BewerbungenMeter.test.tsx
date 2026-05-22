import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BewerbungenMeter } from "./BewerbungenMeter";

describe("BewerbungenMeter", () => {
  it("renders `max` segments with the correct number filled", () => {
    const { container } = render(<BewerbungenMeter filled={3} max={5} />);
    const segments = container.querySelectorAll("span[aria-hidden='true']");
    expect(segments).toHaveLength(5);

    const filled = Array.from(segments).filter((el) =>
      el.className.includes("bg-primary"),
    );
    expect(filled).toHaveLength(3);
  });

  it("renders an accessible label with current and max counts", () => {
    render(<BewerbungenMeter filled={2} max={5} />);
    expect(
      screen.getByRole("img", { name: "2 von 5 aktiven Bewerbungen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders zero filled when filled is 0", () => {
    const { container } = render(<BewerbungenMeter filled={0} max={5} />);
    const filled = container.querySelectorAll("span.bg-primary");
    expect(filled).toHaveLength(0);
  });
});
