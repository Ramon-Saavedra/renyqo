import { render, screen } from "@testing-library/react";
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
      filters: { ...EMPTY_FILTERS, maxColdRent: 900 },
    });

    const selected = screen.getByRole("button", { name: "bis 900 €" });
    expect(selected).toBeInstanceOf(HTMLElement);
    expect(selected.hasAttribute("aria-pressed")).toBe(true);
  });

  it("calls onChange when a cold rent chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "bis 700 €" }));
    expect(onChange).toHaveBeenCalledWith({ maxColdRent: 700 });
  });

  it("calls onChange when a room chip is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "ab 3 Zimmer" }));
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

    await user.click(
      screen.getByRole("button", { name: "Filter schließen" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows result count in the apply button", () => {
    renderDrawer({ resultCount: 5 });
    expect(
      screen.getByText("5 Ergebnisse anzeigen"),
    ).toBeInstanceOf(HTMLElement);
  });

  it("shows singular label for 1 result", () => {
    renderDrawer({ resultCount: 1 });
    expect(
      screen.getByText("1 Ergebnis anzeigen"),
    ).toBeInstanceOf(HTMLElement);
  });
});
