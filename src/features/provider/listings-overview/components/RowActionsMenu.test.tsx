import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingOverviewItem } from "../types";
import { RowActionsMenu } from "./RowActionsMenu";

const BASE: ListingOverviewItem = {
  id: "test-1",
  title: "Testobject",
  displayAddress: "Teststraße 1 · Berlin · 10000",
  coldRent: 900,
  livingArea: 55,
  rooms: 2,
  applicationsCount: 1,
  activeApplicationsCount: 1,
  newApplicationsCount: 0,
  activeApplicationsLimit: 5,
  openQuestionsCount: 0,
  status: "published",
  needsAttention: false,
  attentionReason: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-05-01",
  publishedAt: "2026-01-02",
};

describe("RowActionsMenu", () => {
  it("does not show the menu by default", () => {
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the menu when the trigger button is clicked", async () => {
    const user = userEvent.setup();
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    expect(screen.getByRole("menu")).toBeInstanceOf(HTMLElement);
  });

  it("shows 'Pausieren' when status is published", async () => {
    const user = userEvent.setup();
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    expect(screen.getByRole("menuitem", { name: "Pausieren" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("does not show 'Pausieren' when status is paused", async () => {
    const user = userEvent.setup();
    render(
      <RowActionsMenu
        listing={{ ...BASE, status: "paused" }}
        onAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    expect(screen.queryByRole("menuitem", { name: "Pausieren" })).toBeNull();
  });

  it("shows 'Als vermietet markieren' when status is published", async () => {
    const user = userEvent.setup();
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    expect(
      screen.getByRole("menuitem", { name: "Als vermietet markieren" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("does not show 'Archivieren' when status is archived", async () => {
    const user = userEvent.setup();
    render(
      <RowActionsMenu
        listing={{ ...BASE, status: "archived" }}
        onAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    expect(screen.queryByRole("menuitem", { name: "Archivieren" })).toBeNull();
  });

  it("calls onAction and closes the menu when an item is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<RowActionsMenu listing={BASE} onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    await user.click(screen.getByRole("menuitem", { name: "Pausieren" }));
    expect(onAction).toHaveBeenCalledWith("pause", BASE);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
