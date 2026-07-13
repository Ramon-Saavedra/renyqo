import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { INITIAL_DRAFT } from "../hooks/useListingDraft";
import { AnforderungenSection } from "./AnforderungenSection";

describe("AnforderungenSection", () => {
  it("renders the section heading, note and requirement fields", () => {
    render(<AnforderungenSection draft={INITIAL_DRAFT} setField={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Wer würde gut zu deinem Objekt passen?",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText("Mindesteinkommen netto")).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(screen.getByText("SCHUFA-Auskunft")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Hinweis:")).toBeInstanceOf(HTMLElement);
    const totalField = screen.getByDisplayValue("—");

    expect(totalField).toBeInstanceOf(HTMLElement);
  });

  it("sanitizes the income input and derives the total people label", () => {
    const setField = vi.fn();

    render(
      <AnforderungenSection
        draft={{ ...INITIAL_DRAFT, adults: 2, kids: 1 }}
        setField={setField}
      />,
    );

    fireEvent.change(screen.getByLabelText("Mindesteinkommen netto"), {
      target: { value: "2.500 €" },
    });

    expect(setField).toHaveBeenCalledWith("minIncome", "2500");
    expect(screen.getByDisplayValue("3 Personen")).toBeInstanceOf(HTMLElement);
  });

  it("forwards segmented selection changes", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<AnforderungenSection draft={INITIAL_DRAFT} setField={setField} />);

    await user.click(
      screen.getAllByRole("radio", { name: "Erforderlich" })[0]!,
    );

    expect(setField).toHaveBeenCalledWith("schufa", "erforderlich");
  });
});
