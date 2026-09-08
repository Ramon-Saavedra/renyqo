import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
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

  it("keeps focus on the custom radio after Enter commits an empty value", async () => {
    const user = userEvent.setup();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={null}
        options={COLD_RENT_OPTIONS}
        onChange={vi.fn()}
        custom={custom}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: listingsCopy.filters.coldRent }),
    );
    await user.click(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
    await user.click(
      screen.getByLabelText(listingsCopy.filters.customRentAria),
    );
    await user.keyboard("{Enter}");

    const panel = screen.getByRole("dialog");
    const customRadio = screen.getByRole("radio", {
      name: listingsCopy.filters.customAmount,
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(customRadio);
    });
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(
      screen.queryByLabelText(listingsCopy.filters.customRentAria),
    ).toBeNull();
  });

  it("moves focus to the matching preset after Enter commits a preset value", async () => {
    const user = userEvent.setup();
    render(
      <FilterSelect
        label={listingsCopy.filters.coldRent}
        value={null}
        options={COLD_RENT_OPTIONS}
        onChange={vi.fn()}
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
      "800",
    );
    await user.keyboard("{Enter}");

    const panel = screen.getByRole("dialog");
    const preset = screen.getByRole("radio", { name: "bis 800 €" });
    await waitFor(() => {
      expect(document.activeElement).toBe(preset);
    });
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(
      screen.queryByLabelText(listingsCopy.filters.customRentAria),
    ).toBeNull();
  });

  it("keeps a true custom input focused on Enter and still commits the latest value on blur", async () => {
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
    const input = screen.getByLabelText(listingsCopy.filters.customRentAria);
    await user.type(input, "1150");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(1150);
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);

    await user.type(input, "6");
    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith(11506);
    expect(screen.getByLabelText(listingsCopy.filters.customRentAria)).toBe(
      input,
    );
  });

  it("does not restore focus after Tab commits a preset custom value", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FilterSelect
          label={listingsCopy.filters.coldRent}
          value={null}
          options={COLD_RENT_OPTIONS}
          onChange={vi.fn()}
          custom={custom}
        />
        <button type="button">Nächstes Feld</button>
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: listingsCopy.filters.coldRent }),
    );
    await user.click(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
    await user.type(
      screen.getByLabelText(listingsCopy.filters.customRentAria),
      "800",
    );
    await user.tab();
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).not.toBe(
      screen.getByRole("radio", { name: "bis 800 €" }),
    );
    expect(document.activeElement).not.toBe(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
  });

  it("does not restore focus after Tab commits an empty custom value", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FilterSelect
          label={listingsCopy.filters.coldRent}
          value={null}
          options={COLD_RENT_OPTIONS}
          onChange={vi.fn()}
          custom={custom}
        />
        <button type="button">Nächstes Feld</button>
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: listingsCopy.filters.coldRent }),
    );
    await user.click(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
    await user.click(
      screen.getByLabelText(listingsCopy.filters.customRentAria),
    );
    await user.tab();
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).not.toBe(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
  });

  it("does not restore focus after blur commits a preset custom value", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FilterSelect
          label={listingsCopy.filters.coldRent}
          value={null}
          options={COLD_RENT_OPTIONS}
          onChange={vi.fn()}
          custom={custom}
        />
        <button type="button">Außerhalb</button>
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: listingsCopy.filters.coldRent }),
    );
    await user.click(
      screen.getByRole("radio", { name: listingsCopy.filters.customAmount }),
    );
    const input = screen.getByLabelText(listingsCopy.filters.customRentAria);
    await user.type(input, "800");
    await user.click(screen.getByRole("button", { name: "Außerhalb" }));
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Außerhalb" }),
    );
  });
});
