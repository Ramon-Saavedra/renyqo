import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders initials with the full name as accessible label", () => {
    render(<Avatar initials="SK" label="Sabine Kessler" />);

    expect(screen.getByText("SK")).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("img", { name: "Sabine Kessler" })).toBeInstanceOf(
      HTMLElement,
    );
  });
});
