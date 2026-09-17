import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsHero } from "./ListingsHero";

describe("ListingsHero", () => {
  it("renders the page heading", () => {
    render(<ListingsHero />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Meine Objekte" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("/ provider / listings")).toBeNull();
    expect(
      screen.queryByText(
        "Verwalte deine Mietobjekte, Entwürfe und archivierten Einträge an einem Ort.",
      ),
    ).toBeNull();
  });
});
