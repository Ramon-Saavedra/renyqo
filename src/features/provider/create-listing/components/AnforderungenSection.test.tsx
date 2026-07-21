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
    expect(screen.getByText("Passend für insgesamt")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("does not render provider-selectable household figures", () => {
    render(<AnforderungenSection draft={INITIAL_DRAFT} setField={vi.fn()} />);

    expect(screen.queryByText("Erwachsene")).toBeNull();
    expect(screen.queryByText("Kinder")).toBeNull();
  });

  it("sanitizes the income input", () => {
    const setField = vi.fn();

    render(<AnforderungenSection draft={INITIAL_DRAFT} setField={setField} />);

    fireEvent.change(screen.getByLabelText("Mindesteinkommen netto"), {
      target: { value: "2.500 €" },
    });

    expect(setField).toHaveBeenCalledWith("minIncome", "2500");
  });

  it("renders the people count validation message", () => {
    render(
      <AnforderungenSection
        draft={INITIAL_DRAFT}
        setField={vi.fn()}
        fieldErrors={{
          peopleCount: "Bitte gib eine gültige Personenanzahl an",
        }}
      />,
    );

    expect(
      screen.getByText("Bitte gib eine gültige Personenanzahl an"),
    ).toBeInstanceOf(HTMLElement);
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
