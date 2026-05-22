import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListSummary } from "./ListSummary";

describe("ListSummary", () => {
  it("renders the plural noun when shown is not 1", () => {
    render(<ListSummary total={5} shown={5} sort="updated" onSortChange={vi.fn()} />);
    expect(screen.getByText(/5 Objekte/)).toBeInstanceOf(HTMLElement);
  });

  it("renders the singular noun when shown is 1", () => {
    render(<ListSummary total={5} shown={1} sort="updated" onSortChange={vi.fn()} />);
    expect(screen.getByText(/1 Objekt/)).toBeInstanceOf(HTMLElement);
  });

  it("renders the filtered-of text when shown differs from total", () => {
    render(<ListSummary total={19} shown={3} sort="updated" onSortChange={vi.fn()} />);
    expect(screen.getByText("von 19 gefiltert")).toBeInstanceOf(HTMLElement);
  });

  it("does not render the filtered-of text when shown equals total", () => {
    render(<ListSummary total={5} shown={5} sort="updated" onSortChange={vi.fn()} />);
    expect(screen.queryByText(/gefiltert/)).toBeNull();
  });

  it("renders the sort menu trigger", () => {
    render(<ListSummary total={5} shown={5} sort="updated" onSortChange={vi.fn()} />);
    expect(screen.getByText("Sortieren:")).toBeInstanceOf(HTMLElement);
  });

  it("renders the current sort option label in the trigger", () => {
    render(<ListSummary total={5} shown={5} sort="created" onSortChange={vi.fn()} />);
    expect(screen.getByText("Neueste zuerst")).toBeInstanceOf(HTMLElement);
  });
});
