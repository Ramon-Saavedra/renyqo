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

  it("renders the cover image when the listing has one", () => {
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

    const image = container.querySelector('img[src*="cover.jpg"]');
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image?.className).toContain("rounded");
  });

  it("renders the status pill", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByText("Veröffentlicht")).toBeInstanceOf(HTMLElement);
  });

  it("renders deposit and deposit months", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByText("2.400 €")).toBeInstanceOf(HTMLElement);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
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

  it("does not render an edit (pencil) button", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.queryByRole("button", { name: "Bearbeiten" })).toBeNull();
  });

  it("exposes the actions menu trigger", () => {
    render(<ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />);
    expect(screen.getByRole("button", { name: "Aktionen" })).toBeInstanceOf(
      HTMLElement,
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
      "opacity-75",
    );
  });

  it("does not apply the inactive style for 'published' status", () => {
    const { container } = render(
      <ListingRow listing={BASE} onAction={vi.fn()} now={NOW} />,
    );
    expect(container.querySelector("article")?.className).not.toContain(
      "opacity-75",
    );
  });
});
