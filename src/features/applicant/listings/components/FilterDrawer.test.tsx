import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters } from "../types";
import { FilterDrawer } from "./FilterDrawer";

function renderDrawer(
  overrides: Partial<{
    open: boolean;
    filters: ListingFilters;
    resultCount: number;
  }> = {},
) {
  const onChange = vi.fn();
  const onReset = vi.fn();
  const onClose = vi.fn();

  render(
    <FilterDrawer
      open={overrides.open ?? true}
      filters={overrides.filters ?? EMPTY_FILTERS}
      resultCount={overrides.resultCount ?? 0}
      onChange={onChange}
      onReset={onReset}
      onClose={onClose}
    />,
  );

  return { onChange, onReset, onClose };
}

describe("FilterDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when closed", () => {
    const { container } = render(
      <FilterDrawer
        open={false}
        filters={EMPTY_FILTERS}
        resultCount={0}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the drawer as a dialog when open", () => {
    renderDrawer();
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);
  });

  it("renders filter groups for cold rent, rooms, and area", () => {
    renderDrawer();
    expect(screen.getByText("Kaltmiete")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Zimmer")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Wohnfläche")).toBeInstanceOf(HTMLElement);
  });

  it("renders the date input for available from", () => {
    renderDrawer();
    expect(screen.getByLabelText("Einzug spätestens am")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("marks selected chips as aria-pressed", () => {
    renderDrawer({
      filters: { ...EMPTY_FILTERS, maxColdRent: 1000 },
    });

    const selected = screen.getByRole("button", { name: "bis 1.000 €" });
    expect(selected).toBeInstanceOf(HTMLElement);
    expect(selected.hasAttribute("aria-pressed")).toBe(true);
  });

  it("calls onChange when a cold rent chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "bis 800 €" }));
    expect(onChange).toHaveBeenCalledWith({ maxColdRent: 800 });
  });

  it("calls onChange when a room chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "ab 3" }));
    expect(onChange).toHaveBeenCalledWith({ minRooms: 3 });
  });

  it("calls onReset when reset button is clicked", async () => {
    const user = userEvent.setup();
    const { onReset } = renderDrawer();

    await user.click(
      screen.getByRole("button", { name: "Alle Filter zurücksetzen" }),
    );
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Filter schließen" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows result count in the apply button", () => {
    renderDrawer({ resultCount: 5 });
    expect(screen.getByText("5 Ergebnisse anzeigen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows singular label for 1 result", () => {
    renderDrawer({ resultCount: 1 });
    expect(screen.getByText("1 Ergebnis anzeigen")).toBeInstanceOf(HTMLElement);
  });

  it("marks custom mode when reopening with a non-preset rent", () => {
    renderDrawer({
      filters: { ...EMPTY_FILTERS, maxColdRent: 1150 },
    });

    const custom = screen.getByRole("button", { name: "Eigener Betrag" });
    expect(custom.getAttribute("aria-pressed")).toBe("true");
    const preset = screen.getByRole("button", { name: "bis 800 €" });
    expect(preset.getAttribute("aria-pressed")).toBe("false");
    const input = screen.getByLabelText("Maximale Kaltmiete in Euro");
    expect((input as HTMLInputElement).value).toBe("1150");
    expect((input as HTMLInputElement).inputMode).toBe("numeric");
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("replaces a custom rent when a preset chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDrawer({
      filters: { ...EMPTY_FILTERS, maxColdRent: 1150 },
    });

    await user.click(screen.getByRole("button", { name: "bis 800 €" }));
    expect(onChange).toHaveBeenCalledWith({ maxColdRent: 800 });
  });

  it("commits a typed custom rent when the drawer closes with Escape", async () => {
    const user = userEvent.setup();
    const { onChange, onClose } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.type(
      screen.getByLabelText("Maximale Kaltmiete in Euro"),
      "1150",
    );
    await user.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledWith({ maxColdRent: 1150 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not clear a preset rent when closing after choosing a chip", async () => {
    const user = userEvent.setup();
    const { onChange, onClose } = renderDrawer({
      filters: { ...EMPTY_FILTERS, maxColdRent: 1150 },
    });

    await user.click(screen.getByRole("button", { name: "bis 800 €" }));
    expect(onChange).toHaveBeenCalledWith({ maxColdRent: 800 });
    onChange.mockClear();
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps focus on the custom chip after Enter commits an empty rent", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.click(screen.getByLabelText("Maximale Kaltmiete in Euro"));
    await user.keyboard("{Enter}");

    const drawer = screen.getByRole("dialog");
    const customChip = screen.getByRole("button", { name: "Eigener Betrag" });
    await waitFor(() => {
      expect(document.activeElement).toBe(customChip);
    });
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(screen.queryByLabelText("Maximale Kaltmiete in Euro")).toBeNull();
  });

  it("moves focus to the matching preset chip after Enter commits a preset rent", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.type(screen.getByLabelText("Maximale Kaltmiete in Euro"), "800");
    await user.keyboard("{Enter}");

    const drawer = screen.getByRole("dialog");
    const preset = screen.getByRole("button", { name: "bis 800 €" });
    await waitFor(() => {
      expect(document.activeElement).toBe(preset);
    });
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(screen.queryByLabelText("Maximale Kaltmiete in Euro")).toBeNull();
  });

  it("does not restore focus after Tab commits a preset custom rent", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.type(screen.getByLabelText("Maximale Kaltmiete in Euro"), "800");
    await user.tab();
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).not.toBe(
      screen.getByRole("button", { name: "bis 800 €" }),
    );
    expect(document.activeElement).not.toBe(
      screen.getByRole("button", { name: "Eigener Betrag" }),
    );
  });

  it("does not restore focus after Tab commits an empty custom rent", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.click(screen.getByLabelText("Maximale Kaltmiete in Euro"));
    await user.tab();
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).not.toBe(
      screen.getByRole("button", { name: "Eigener Betrag" }),
    );
  });

  it("does not restore focus after clicking away from a preset custom rent", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Eigener Betrag" }));
    await user.type(screen.getByLabelText("Maximale Kaltmiete in Euro"), "800");
    const rooms = screen.getByRole("button", { name: "ab 3" });
    await user.click(rooms);
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(document.activeElement).toBe(rooms);
    expect(document.activeElement).not.toBe(
      screen.getByRole("button", { name: "bis 800 €" }),
    );
  });
});
