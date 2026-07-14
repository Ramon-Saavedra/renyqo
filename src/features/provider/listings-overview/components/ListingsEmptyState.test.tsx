import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingsEmptyState } from "./ListingsEmptyState";

describe("ListingsEmptyState", () => {
  it("renders the fresh variant with a new-listing link", () => {
    render(<ListingsEmptyState variant="fresh" />);

    expect(screen.getByText("Noch keine Mietobjekte angelegt.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByRole("link", { name: "Mietobjekt anlegen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("calls onShowAll from the archived-only variant", async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();

    render(
      <ListingsEmptyState variant="archived-only" onShowAll={onShowAll} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Alle Objekte anzeigen" }),
    );

    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it("calls onResetFilters from the filtered variant", async () => {
    const user = userEvent.setup();
    const onResetFilters = vi.fn();

    render(
      <ListingsEmptyState variant="filtered" onResetFilters={onResetFilters} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    );

    expect(onResetFilters).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("link", { name: "Mietobjekt anlegen" }),
    ).toBeNull();
  });
});
