import { render, screen } from "@testing-library/react";
import { Info } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Note } from "./Note";

describe("Note", () => {
  it("renders children text", () => {
    render(<Note icon={Info}>Bitte ausfüllen</Note>);

    expect(screen.getByText("Bitte ausfüllen")).toBeInstanceOf(HTMLElement);
  });

  it("renders the icon as an svg element", () => {
    const { container } = render(<Note icon={Info}>Text</Note>);

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });

  it("always applies the base classes", () => {
    const { container } = render(<Note icon={Info}>Text</Note>);
    const div = container.querySelector("div");

    expect(div?.className).toContain("flex");
    expect(div?.className).toContain("rounded-md");
    expect(div?.className).toContain("border-border");
    expect(div?.className).toContain("bg-background-subtle");
  });

  it("appends a custom className alongside the base classes", () => {
    const { container } = render(
      <Note icon={Info} className="mt-4">
        Text
      </Note>,
    );
    const div = container.querySelector("div");

    expect(div?.className).toContain("mt-4");
    expect(div?.className).toContain("rounded-md");
  });

  it("omits extra classes when no className is provided", () => {
    const { container } = render(<Note icon={Info}>Text</Note>);
    const div = container.querySelector("div");

    expect(div?.className).not.toContain("undefined");
    expect(div?.className).not.toMatch(/\s{2,}/);
  });
});
