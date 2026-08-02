import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import { DocumentsSection } from "./DocumentsSection";

describe("DocumentsSection", () => {
  it("renders the heading, both proof questions and the upload hint", () => {
    render(<DocumentsSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Nachweise & weitere Angaben",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("radiogroup", { name: "Einkommensnachweis vorhanden" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("radiogroup", { name: "SCHUFA-Auskunft vorhanden" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText(
        "Nachweise musst du jetzt noch nicht hochladen. Falls du ausgewählt wirst, reichst du sie später ein.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("forwards the SCHUFA answer", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<DocumentsSection draft={INITIAL_PROFILE} setField={setField} />);

    const schufa = screen.getByRole("radiogroup", {
      name: "SCHUFA-Auskunft vorhanden",
    });
    await user.click(within(schufa).getByRole("radio", { name: "Ja" }));

    expect(setField).toHaveBeenCalledWith("schufa", "ja");
  });

  it("hides the pets detail field until pets are confirmed", () => {
    render(<DocumentsSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(screen.queryByLabelText("Welche Haustiere?")).toBeNull();
  });

  it("reveals the pets detail field once pets are confirmed", () => {
    render(
      <DocumentsSection
        draft={{ ...INITIAL_PROFILE, pets: "ja" }}
        setField={vi.fn()}
      />,
    );

    const note = screen.getByLabelText("Welche Haustiere?");
    expect(note).toBeInstanceOf(HTMLInputElement);
    expect(note).toHaveProperty("maxLength", 500);
  });

  it("forwards the smoker status", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<DocumentsSection draft={INITIAL_PROFILE} setField={setField} />);

    await user.click(screen.getByRole("radio", { name: "Nichtraucher" }));

    expect(setField).toHaveBeenCalledWith("smoker", "nichtraucher");
  });
});
