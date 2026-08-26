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

  it("does not render a pets detail field", () => {
    render(<DocumentsSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("forwards the smoker answer", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<DocumentsSection draft={INITIAL_PROFILE} setField={setField} />);

    const smoker = screen.getByRole("radiogroup", { name: "Raucher?" });
    await user.click(within(smoker).getByRole("radio", { name: "Ja" }));

    expect(setField).toHaveBeenCalledWith("smoker", "ja");
  });

  it("renders binary pets and smoker choices", () => {
    render(<DocumentsSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(
      screen.getByRole("radiogroup", { name: "Haustiere?" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("radiogroup", { name: "Raucher?" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.queryByRole("radio", { name: "Gelegentlich" })).toBeNull();
  });
});
