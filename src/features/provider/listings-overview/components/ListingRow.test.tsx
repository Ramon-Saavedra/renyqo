import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ListingOverviewItem } from "../types";
import { ListingRow } from "./ListingRow";

const NOW = new Date("2026-05-22T12:00:00");

const BASE: ListingOverviewItem = {
  id: "row-1",
  title: "Helle Wohnung am Park",
  displayAddress: "Parkstraße 12 · Berlin, Mitte · 10115",
  coldRent: 1200,
  deposit: 2400,
  depositMonths: 2,
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
  it("renders the listing summary and actions trigger", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);

    expect(screen.getByText("Helle Wohnung am Park")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByText("Parkstraße 12 · Berlin, Mitte · 10115"),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Veröffentlicht")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("3 sichtbar")).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("button", { name: "Aktionen" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the cover image when provided", () => {
    const { container } = render(
      <ListingRow
        listing={{
          ...BASE,
          coverImageUrl: "https://example.com/cover.jpg",
        }}
        onAction={vi.fn()}
        now={NOW}
      />,
    );

    expect(container.querySelector('img[src*="cover.jpg"]')).toBeInstanceOf(
      HTMLImageElement,
    );
  });

  it("renders the waiting application label when applications exceed the visible limit", () => {
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

  it("renders attention state only when needed", () => {
    const { rerender } = render(
      <ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />,
    );

    expect(screen.queryByRole("img", { name: /Rückfragen/ })).toBeNull();

    rerender(
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
});
