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
  deposit: 1800,
  depositMonths: 2,
  livingArea: 55,
  rooms: 2,
  applicationsTotal: 1,
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

  it("shows only the 'Details ansehen' action", async () => {
    const user = userEvent.setup();
    render(<RowActionsMenu listing={BASE} onAction={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("Details ansehen");
  });

  it("calls onAction with 'details' and closes the menu when clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<RowActionsMenu listing={BASE} onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Aktionen" }));
    await user.click(screen.getByRole("menuitem", { name: "Details ansehen" }));
    expect(onAction).toHaveBeenCalledWith("details", BASE);
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
