import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders the initials provided", () => {
    render(<Avatar initials="SK" label="Sabine Kessler" />);

    expect(screen.getByText("SK")).toBeInstanceOf(HTMLElement);
  });

  it("exposes the full name through an aria-label", () => {
    render(<Avatar initials="SK" label="Sabine Kessler" />);

    expect(screen.getByRole("img", { name: "Sabine Kessler" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("appends a custom className to the base classes", () => {
    const { container } = render(
      <Avatar initials="SK" label="Sabine Kessler" className="ml-4" />,
    );
    const root = container.firstElementChild;

    expect(root?.className).toContain("rounded-full");
    expect(root?.className).toContain("ml-4");
  });
});
