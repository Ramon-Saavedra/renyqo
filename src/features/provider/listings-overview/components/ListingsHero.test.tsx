import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsHero } from "./ListingsHero";

describe("ListingsHero", () => {
  it("renders the page heading and new-listing link", () => {
    render(<ListingsHero />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Meine Objekte" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("link", { name: "Weiteres Mietobjekt anlegen" })
        .getAttribute("href"),
    ).toBe("/provider/listings/new");
  });
});
