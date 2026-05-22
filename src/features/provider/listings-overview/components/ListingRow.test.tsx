import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingOverviewItem } from "../types";
import { ListingRow } from "./ListingRow";

const NOW = new Date("2026-05-22T12:00:00");

const BASE: ListingOverviewItem = {
  id: "row-1",
  title: "Helle Wohnung am Park",
  displayAddress: "Parkstraße 12 · Berlin, Mitte · 10115",
  coldRent: 1200,
  livingArea: 68,
  rooms: 2,
  applicationsTotal: 3,
  openQuestionsCount: 0,
  status: "published",
  needsAttention: false,
  attentionReason: null,
  createdAt: "2026-04-01",
  updatedAt: "2026-05-20T10:00:00",
  publishedAt: "2026-04-02T10:00:00",
};

describe("ListingRow", () => {
  it("renders the listing title", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByText("Helle Wohnung am Park")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the displayAddress", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(
      screen.getByText("Parkstraße 12 · Berlin, Mitte · 10115"),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the status pill", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByText("Aktiv")).toBeInstanceOf(HTMLElement);
  });

  it("renders the applications label '3 sichtbar' for applicationsTotal 3", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByText("3 sichtbar")).toBeInstanceOf(HTMLElement);
  });

  it("renders '5 sichtbar · 12 wartend' when applicationsTotal is 17", () => {
    render(
      <ListingRow
        listing={{ ...BASE, applicationsTotal: 17 }}
        onAction={vi.fn()}
        now={NOW}
      />,
    );
    expect(screen.getByText("5 sichtbar · 12 wartend")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the AttentionPill when needsAttention is true with a reason", () => {
    render(
      <ListingRow
        listing={{
          ...BASE,
          needsAttention: true,
          attentionReason: "open_questions",
        }}
        onAction={vi.fn()}
        now={NOW}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Rückfragen offen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("does not render the AttentionPill when needsAttention is false", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.queryByRole("img", { name: /Rückfragen/ })).toBeNull();
  });

  it("calls onAction with 'edit' and the listing when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ListingRow listing={BASE} onAction={onAction} now={NOW} />);
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));
    expect(onAction).toHaveBeenCalledWith("edit", BASE);
  });

  it("applies the inactive style for 'rented' status", () => {
    const { container } = render(
      <ListingRow
        listing={{ ...BASE, status: "rented" }}
        onAction={vi.fn()}
        now={NOW}
      />,
    );
    expect(container.querySelector("article")?.className).toContain(
      "bg-background-subtle",
    );
  });

  it("applies the inactive style for 'archived' status", () => {
    const { container } = render(
      <ListingRow
        listing={{ ...BASE, status: "archived" }}
        onAction={vi.fn()}
        now={NOW}
      />,
    );
    expect(container.querySelector("article")?.className).toContain(
      "bg-background-subtle",
    );
  });

  it("does not apply the inactive style for 'published' status", () => {
    const { container } = render(
      <ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />,
    );
    expect(container.querySelector("article")?.className).not.toContain(
      "bg-background-subtle",
    );
  });
});
