import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppTopbar } from "./AppTopbar";

describe("AppTopbar", () => {
  it("renders the brand logo", () => {
    render(<AppTopbar />);

    expect(screen.getByText("renyqo")).toBeInstanceOf(HTMLElement);
  });

  it("renders action children on the right", () => {
    render(
      <AppTopbar>
        <button type="button">Hilfe</button>
      </AppTopbar>,
    );

    expect(screen.getByRole("button", { name: "Hilfe" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("applies the topbar base classes", () => {
    const { container } = render(<AppTopbar />);
    const header = container.querySelector("header");

    expect(header?.className).toContain("border-b");
    expect(header?.className).toContain("border-border");
    expect(header?.className).toContain("px-14");
    expect(header?.className).toContain("py-5.5");
  });

  it("appends a custom className", () => {
    const { container } = render(<AppTopbar className="mb-section" />);
    const header = container.querySelector("header");

    expect(header?.className).toContain("mb-section");
  });
});
