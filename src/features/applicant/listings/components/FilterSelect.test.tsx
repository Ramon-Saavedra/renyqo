import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { COLD_RENT_OPTIONS, listingsCopy } from "../copy/listings";
import { formatMaxRentChoice } from "../utils/filter-value";
import { FilterSelect } from "./FilterSelect";

const custom = {
  optionLabel: listingsCopy.filters.customAmount,
  suffix: listingsCopy.filters.euroSuffix,
  inputAriaLabel: listingsCopy.filters.customRentAria,
  formatValue: formatMaxRentChoice,
} as const;

describe("FilterSelect custom value", () => {
  it("marks custom mode as selected when reopening with a non-preset value", async () => {
    const user = userEvent.setup();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={1150}
        options={COLD_RENT_OPTIONS}
        onChange={vi.fn()}
        custom={custom}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: `${listingsCopy.filters.coldRent} ${formatMaxRentChoice(1150)}`,
      }),
    ).toBeInstanceOf(HTMLElement);

    await user.click(
      screen.getByRole("button", {
        name: `${listingsCopy.filters.coldRent} ${formatMaxRentChoice(1150)}`,
      }),
    );

    const customOption = screen.getByRole("radio", {
      name: listingsCopy.filters.customAmount,
    });
    expect(customOption.getAttribute("aria-checked")).toBe("true");
    const input = screen.getByLabelText(listingsCopy.filters.customRentAria);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect((input as HTMLInputElement).value).toBe("1150");
    expect(
      screen
        .getByRole("radiogroup", { name: listingsCopy.filters.coldRent })
        .contains(input),
    ).toBe(false);
    expect((input as HTMLInputElement).inputMode).toBe("numeric");
  });

  it("replaces a custom value when a preset is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={1150}
        options={COLD_RENT_OPTIONS}
        onChange={onChange}
        custom={custom}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${listingsCopy.filters.coldRent} ${formatMaxRentChoice(1150)}`,
      }),
    );
    await user.click(screen.getByRole("radio", { name: "bis 800 €" }));
    expect(onChange).toHaveBeenCalledWith(800);
  });

  it("commits a typed custom value when the popover closes with Escape", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={null}
        options={COLD_RENT_OPTIONS}
        onChange={onChange}
        custom={custom}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: listingsCopy.filters.coldRent }),
    );
    await user.click(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
    await user.type(
      screen.getByLabelText(listingsCopy.filters.customRentAria),
      "1150",
    );
    await user.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledWith(1150);
  });

  it("does not clear a preset when closing after choosing one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={1150}
        options={COLD_RENT_OPTIONS}
        onChange={onChange}
        custom={custom}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${listingsCopy.filters.coldRent} ${formatMaxRentChoice(1150)}`,
      }),
    );
    await user.click(screen.getByRole("radio", { name: "bis 800 €" }));
    onChange.mockClear();
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
  });
});
