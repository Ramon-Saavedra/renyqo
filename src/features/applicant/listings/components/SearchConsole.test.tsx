import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters } from "../types";
import { SearchConsole } from "./SearchConsole";

describe("SearchConsole", () => {
  const onChange = vi.fn();
  const onOpenDrawer = vi.fn();

  function renderConsole(
    filters: ListingFilters = EMPTY_FILTERS,
    showMatchToggle = false,
  ) {
    render(
      <SearchConsole
        filters={filters}
        showMatchToggle={showMatchToggle}
        onChange={onChange}
        onOpenDrawer={onOpenDrawer}
      />,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search field", () => {
    renderConsole();
    expect(
      screen.getByLabelText("Wohnungen nach Ort durchsuchen"),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders filter select buttons", () => {
    renderConsole();
    expect(screen.getByRole("button", { name: "Kaltmiete" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("button", { name: "Zimmer" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows the match toggle only when showMatchToggle is true", () => {
    renderConsole(EMPTY_FILTERS, false);
    expect(screen.queryByText("Nur passende Wohnungen")).toBeNull();

    renderConsole(EMPTY_FILTERS, true);
    expect(screen.getByText("Nur passende Wohnungen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("match toggle aria-pressed reflects filters.onlyMatching", () => {
    renderConsole({ ...EMPTY_FILTERS, onlyMatching: true }, true);
    const toggle = screen.getByRole("button", {
      name: "Nur passende Wohnungen",
    });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders the mobile filter button with active count badge", () => {
    renderConsole({ ...EMPTY_FILTERS, maxColdRent: 900, minRooms: 2 }, false);
    const btn = screen.getByRole("button", { name: /Filter/ });
    expect(btn).toBeInstanceOf(HTMLElement);
    expect(btn.textContent).toContain("2");
  });

  it("calls onOpenDrawer when mobile filter button is clicked", async () => {
    const user = userEvent.setup();
    renderConsole();

    await user.click(screen.getByRole("button", { name: /Filter/ }));
    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });
});
