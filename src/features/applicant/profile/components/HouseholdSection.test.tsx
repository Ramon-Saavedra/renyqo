import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import { HouseholdSection } from "./HouseholdSection";

describe("HouseholdSection", () => {
  it("renders the heading, income field and household counts", () => {
    render(<HouseholdSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Einkommen und Haushaltsgröße",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText(/Haushaltsnettoeinkommen/)).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(screen.getByRole("group", { name: "Erwachsene" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("group", { name: "Kinder" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("sanitizes the income input", () => {
    const setField = vi.fn();

    render(<HouseholdSection draft={INITIAL_PROFILE} setField={setField} />);

    fireEvent.change(screen.getByLabelText(/Haushaltsnettoeinkommen/), {
      target: { value: "3.200 €" },
    });

    expect(setField).toHaveBeenCalledWith("income", "3200");
  });

  it("shows the computed household size", () => {
    render(<HouseholdSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(screen.getByText("Automatisch berechnet")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("1 Person")).toBeInstanceOf(HTMLElement);

    render(
      <HouseholdSection
        draft={{ ...INITIAL_PROFILE, adults: 2, children: 1 }}
        setField={vi.fn()}
      />,
    );

    expect(screen.getByText("3 Personen")).toBeInstanceOf(HTMLElement);
  });

  it("increments the number of children", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<HouseholdSection draft={INITIAL_PROFILE} setField={setField} />);

    const children = screen.getByRole("group", { name: "Kinder" });
    await user.click(
      within(children).getByRole("button", { name: "Wert erhöhen" }),
    );

    expect(setField).toHaveBeenCalledWith("children", 1);
  });

  it("keeps adults at the minimum of one", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();

    render(<HouseholdSection draft={INITIAL_PROFILE} setField={setField} />);

    const adults = screen.getByRole("group", { name: "Erwachsene" });
    const decrement = within(adults).getByRole("button", {
      name: "Wert verringern",
    });

    expect(decrement).toHaveProperty("disabled", true);
    await user.click(decrement);
    expect(setField).not.toHaveBeenCalled();
  });

  it("renders the income validation message", () => {
    render(
      <HouseholdSection
        draft={{ ...INITIAL_PROFILE, income: "0" }}
        setField={vi.fn()}
        errors={{ income: "Bitte einen Betrag über 0 € angeben." }}
      />,
    );

    expect(
      screen.getByText("Bitte einen Betrag über 0 € angeben."),
    ).toBeInstanceOf(HTMLElement);
  });
});
