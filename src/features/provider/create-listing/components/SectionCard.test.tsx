import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionCard } from "./SectionCard";

describe("SectionCard", () => {
  it("renders the section heading, description and children", () => {
    const { container } = render(
      <SectionCard
        id="sec-01"
        num="01 · Objektdaten"
        title="Das Wichtigste zu deiner Immobilie"
        description="Diese Angaben helfen Suchenden, dein Objekt zu finden."
      >
        <div>Feldinhalt</div>
      </SectionCard>,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Das Wichtigste zu deiner Immobilie",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText(
        "Diese Angaben helfen Suchenden, dein Objekt zu finden.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Feldinhalt")).toBeInstanceOf(HTMLElement);
    expect(container.querySelector("section#sec-01")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("appends a custom className to the base section styles", () => {
    const { container } = render(
      <SectionCard
        id="sec-02"
        num="02 · Anforderungen"
        title="Titel"
        description="Beschreibung"
        className="custom-class"
      >
        <div>Inhalt</div>
      </SectionCard>,
    );

    const section = container.querySelector("section");

    expect(section?.className).toContain("custom-class");
    expect(section?.className).toContain("rounded-md");
    expect(section?.className).toContain("border-border");
  });
});
