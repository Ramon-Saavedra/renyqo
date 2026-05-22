import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsTopbarActions } from "./ListingsTopbarActions";

describe("ListingsTopbarActions", () => {
  it("renders the back link", () => {
    render(<ListingsTopbarActions />);
    expect(
      screen.getByRole("link", { name: /Zurück zum Dashboard/ }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("points to the provider dashboard", () => {
    render(<ListingsTopbarActions />);
    const link = screen.getByRole("link", { name: /Zurück zum Dashboard/ });
    expect(link.getAttribute("href")).toBe("/provider/dashboard");
  });
});
