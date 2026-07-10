import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsLoadingSkeleton } from "./ListingsLoadingSkeleton";

describe("ListingsLoadingSkeleton", () => {
  it("renders the loading label and a cascade of skeleton rows", () => {
    const { container } = render(<ListingsLoadingSkeleton />);

    expect(screen.getByText("Mietobjekte werden geladen …")).toBeInstanceOf(
      HTMLElement,
    );
    expect(container.querySelectorAll(".reveal-wrap")).toHaveLength(4);
    expect(container.querySelectorAll(".veil")).toHaveLength(4);
  });

  it("staggers the rows so they do not all pulse at once", () => {
    const { container } = render(<ListingsLoadingSkeleton />);
    const wraps = Array.from(
      container.querySelectorAll<HTMLElement>(".reveal-wrap"),
    );
    expect(wraps[1]?.style.getPropertyValue("--rq-stagger")).toBe("0.5s");
    expect(wraps[3]?.style.getPropertyValue("--rq-stagger")).toBe("1.5s");
  });
});
