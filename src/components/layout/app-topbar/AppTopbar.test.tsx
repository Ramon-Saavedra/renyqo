import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { AppTopbar } from "./AppTopbar";

describe("AppTopbar", () => {
  it("renders the brand logo", () => {
    render(<AppTopbar />);

    expect(screen.getByText("Renyqo")).toBeInstanceOf(HTMLElement);
  });

  it("links the logo to the public homepage by default", () => {
    render(<AppTopbar />);

    expect(
      screen.getByRole("link", { name: "Renyqo" }).getAttribute("href"),
    ).toBe("/");
  });

  it("supports provider-specific logo navigation", async () => {
    const user = userEvent.setup();
    const onLogoClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    });

    render(
      <AppTopbar logoHref="/provider/dashboard" onLogoClick={onLogoClick} />,
    );

    const logoLink = screen.getByRole("link", { name: "Renyqo" });

    expect(logoLink.getAttribute("href")).toBe("/provider/dashboard");

    await user.click(logoLink);

    expect(onLogoClick).toHaveBeenCalledTimes(1);
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
    expect(header?.className).toContain("px-gutter");
    expect(header?.className).toContain("py-5.5");
  });

  it("appends a custom className", () => {
    const { container } = render(<AppTopbar className="mb-section" />);
    const header = container.querySelector("header");

    expect(header?.className).toContain("mb-section");
  });
});
