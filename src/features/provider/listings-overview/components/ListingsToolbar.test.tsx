import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingsToolbar } from "./ListingsToolbar";

describe("ListingsToolbar", () => {
  it("renders the search input with the correct aria-label", () => {
    render(<ListingsToolbar value="" onChange={vi.fn()} />);
    expect(
      screen.getByLabelText("Mietobjekte durchsuchen")
    ).toBeInstanceOf(HTMLInputElement);
  });

  it("reflects the value prop in the input", () => {
    render(<ListingsToolbar value="Berlin" onChange={vi.fn()} />);
    expect(
      (screen.getByLabelText("Mietobjekte durchsuchen") as HTMLInputElement).value
    ).toBe("Berlin");
  });

  it("calls onChange when the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListingsToolbar value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("Mietobjekte durchsuchen"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("does not show the clear button when value is empty", () => {
    render(<ListingsToolbar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Suche leeren")).toBeNull();
  });

  it("shows the clear button when value is non-empty", () => {
    render(<ListingsToolbar value="Berlin" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Suche leeren")).toBeInstanceOf(HTMLElement);
  });

  it("calls onChange with empty string when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ListingsToolbar value="Berlin" onChange={onChange} />);
    await user.click(screen.getByLabelText("Suche leeren"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
