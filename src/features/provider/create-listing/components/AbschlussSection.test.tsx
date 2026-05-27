import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { INITIAL_DRAFT } from "../hooks/useListingDraft";
import { AbschlussSection } from "./AbschlussSection";

describe("AbschlussSection", () => {
  it("renders the section heading, status pill and legal copy", () => {
    render(<AbschlussSection draft={INITIAL_DRAFT} setField={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Bereit zum Speichern oder Veröffentlichen?",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Entwurf")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Aktueller Status — nicht öffentlich sichtbar."),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText(
        "Ich bin Eigentümer:in oder bevollmächtigt, dieses Objekt zu inserieren.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("forwards legal acceptance changes", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<AbschlussSection draft={INITIAL_DRAFT} setField={setField} />);

    await user.click(screen.getByRole("checkbox"));

    expect(setField).toHaveBeenCalledWith("legalAccepted", true);
  });
});
