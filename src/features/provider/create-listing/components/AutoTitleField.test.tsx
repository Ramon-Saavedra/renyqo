import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AutoTitleField } from "./AutoTitleField";

describe("AutoTitleField", () => {
  it("renders the generated title in the default automatic state", () => {
    render(
      <AutoTitleField
        autoTitle="2-Zimmer-Wohnung in Berlin"
        isAutoPlaceholder={false}
        override=""
        onOverrideChange={() => {}}
      />,
    );

    expect(
      screen.getByText("Vorschlag · automatisch generiert"),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("2-Zimmer-Wohnung in Berlin")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("Eigener Titel · optional")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the override state and the placeholder when no auto title is available", () => {
    render(
      <AutoTitleField
        autoTitle=""
        isAutoPlaceholder={true}
        override="Mein eigener Titel"
        onOverrideChange={() => {}}
      />,
    );

    expect(screen.getByText("Vorschlag · wird ersetzt")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByText(
        "Ergänze Adresse und Zimmer, um einen Titelvorschlag zu sehen",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Eigener Titel · aktiv")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByDisplayValue("Mein eigener Titel")).toBeInstanceOf(
      HTMLInputElement,
    );
  });

  it("forwards input changes through onOverrideChange", () => {
    const onOverrideChange = vi.fn();

    render(
      <AutoTitleField
        autoTitle="Titel"
        isAutoPlaceholder={false}
        override=""
        onOverrideChange={onOverrideChange}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("z. B. Helle Altbauwohnung mit Balkon"),
      {
        target: { value: "Neuer Titel" },
      },
    );

    expect(onOverrideChange).toHaveBeenCalledWith("Neuer Titel");
  });
});
