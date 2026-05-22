import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsTrustLine } from "./ListingsTrustLine";

describe("ListingsTrustLine", () => {
  it("renders the lead text prefix", () => {
    render(<ListingsTrustLine />);
    expect(screen.getByText(/Anforderungen sind/)).toBeInstanceOf(HTMLElement);
  });

  it("renders the strong emphasis phrase", () => {
    render(<ListingsTrustLine />);
    expect(screen.getByText("praktische Erwartungen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the tail text mentioning SCHUFA", () => {
    render(<ListingsTrustLine />);
    expect(screen.getByText(/SCHUFA/)).toBeInstanceOf(HTMLElement);
  });

  it("renders the strong phrase inside a <strong> element", () => {
    const { container } = render(<ListingsTrustLine />);
    const strong = container.querySelector("strong");
    expect(strong?.textContent).toBe("praktische Erwartungen");
  });
});
