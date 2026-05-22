import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingsEmptyState } from "./ListingsEmptyState";

describe("ListingsEmptyState", () => {
  describe("fresh variant", () => {
    it("renders the fresh title", () => {
      render(<ListingsEmptyState variant="fresh" />);
      expect(screen.getByText("Noch keine Mietobjekte angelegt.")).toBeInstanceOf(HTMLElement);
    });

    it("renders the fresh lead paragraph", () => {
      render(<ListingsEmptyState variant="fresh" />);
      expect(
        screen.getByText(/Sobald du dein erstes Mietobjekt anlegst/)
      ).toBeInstanceOf(HTMLElement);
    });

    it("renders a link to create a new listing", () => {
      render(<ListingsEmptyState variant="fresh" />);
      expect(
        screen.getByRole("link", { name: /Neues Mietobjekt anlegen/ })
      ).toBeInstanceOf(HTMLElement);
    });

    it("does not render the show-all button", () => {
      render(<ListingsEmptyState variant="fresh" />);
      expect(screen.queryByRole("button", { name: "Alle Objekte anzeigen" })).toBeNull();
    });
  });

  describe("archived-only variant", () => {
    it("renders the archived title", () => {
      render(<ListingsEmptyState variant="archived-only" />);
      expect(
        screen.getByText("Du hast aktuell keine aktiven Mietobjekte.")
      ).toBeInstanceOf(HTMLElement);
    });

    it("renders the show-all button when onShowAll is provided", () => {
      render(<ListingsEmptyState variant="archived-only" onShowAll={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Alle Objekte anzeigen" })).toBeInstanceOf(HTMLElement);
    });

    it("calls onShowAll when the show-all button is clicked", async () => {
      const user = userEvent.setup();
      const onShowAll = vi.fn();
      render(<ListingsEmptyState variant="archived-only" onShowAll={onShowAll} />);
      await user.click(screen.getByRole("button", { name: "Alle Objekte anzeigen" }));
      expect(onShowAll).toHaveBeenCalledOnce();
    });

    it("does not render the show-all button when onShowAll is not provided", () => {
      render(<ListingsEmptyState variant="archived-only" />);
      expect(screen.queryByRole("button", { name: "Alle Objekte anzeigen" })).toBeNull();
    });
  });

  describe("filtered variant", () => {
    it("renders the filtered title", () => {
      render(<ListingsEmptyState variant="filtered" />);
      expect(screen.getByText("Keine Objekte für diese Filter.")).toBeInstanceOf(HTMLElement);
    });

    it("renders the reset button when onResetFilters is provided", () => {
      render(<ListingsEmptyState variant="filtered" onResetFilters={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Filter zurücksetzen" })).toBeInstanceOf(HTMLElement);
    });

    it("calls onResetFilters when the reset button is clicked", async () => {
      const user = userEvent.setup();
      const onResetFilters = vi.fn();
      render(<ListingsEmptyState variant="filtered" onResetFilters={onResetFilters} />);
      await user.click(screen.getByRole("button", { name: "Filter zurücksetzen" }));
      expect(onResetFilters).toHaveBeenCalledOnce();
    });

    it("does not render the new-listing link", () => {
      render(<ListingsEmptyState variant="filtered" onResetFilters={vi.fn()} />);
      expect(screen.queryByRole("link", { name: /Neues Mietobjekt/ })).toBeNull();
    });
  });
});
