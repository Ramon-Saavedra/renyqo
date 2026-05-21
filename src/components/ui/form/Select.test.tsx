import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "./Select";

describe("Select", () => {
  it("renders option children", () => {
    render(
      <Select defaultValue="">
        <option value="">Bitte wählen</option>
        <option value="1">Eins</option>
      </Select>,
    );

    expect(screen.getByText("Bitte wählen")).toBeInstanceOf(HTMLOptionElement);
    expect(screen.getByText("Eins")).toBeInstanceOf(HTMLOptionElement);
  });

  it("renders a decorative chevron icon", () => {
    const { container } = render(
      <Select defaultValue="">
        <option value="">x</option>
      </Select>,
    );
    const svg = container.querySelector("svg");

    expect(svg).toBeInstanceOf(SVGElement);
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("calls onChange when the user picks an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select value="" onChange={onChange}>
        <option value="">empty</option>
        <option value="a">a</option>
        <option value="b">b</option>
      </Select>,
    );

    await user.selectOptions(screen.getByRole("combobox"), "a");

    expect(onChange).toHaveBeenCalled();
  });

  it("appends a custom className", () => {
    const { container } = render(
      <Select className="custom-class" defaultValue="">
        <option value="">x</option>
      </Select>,
    );
    const select = container.querySelector("select");

    expect(select?.className).toContain("custom-class");
    expect(select?.className).toContain("h-11");
  });
});
