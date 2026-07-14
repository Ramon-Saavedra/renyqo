import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListSummary } from "./ListSummary";

describe("ListSummary", () => {
  it("renders count, filtered text and sort trigger", () => {
    render(
      <ListSummary
        total={19}
        shown={3}
        sort="created"
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.getByText("3 Objekte")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("von 19 gefiltert")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Sortieren:")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Neueste zuerst")).toBeInstanceOf(HTMLElement);
  });

  it("uses the singular noun for one shown listing", () => {
    render(
      <ListSummary total={5} shown={1} sort="updated" onSortChange={vi.fn()} />,
    );

    expect(screen.getByText("1 Objekt")).toBeInstanceOf(HTMLElement);
  });
});
