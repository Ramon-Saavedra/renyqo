import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageShell } from "./PageShell";

describe("PageShell", () => {
  it("renders children inside the container", () => {
    render(
      <PageShell>
        <span>child</span>
      </PageShell>,
    );

    expect(screen.getByText("child")).toBeInstanceOf(HTMLElement);
  });

  it("applies the page-width tokens to the inner container", () => {
    const { container } = render(
      <PageShell>
        <span />
      </PageShell>,
    );
    const inner = container.querySelector("main > div");

    expect(inner?.className).toContain("max-w-page");
    expect(inner?.className).toContain("mx-auto");
    expect(inner?.className).toContain("pb-section");
  });

  it("appends a custom className to the inner container", () => {
    const { container } = render(
      <PageShell className="custom-class">
        <span />
      </PageShell>,
    );
    const inner = container.querySelector("main > div");

    expect(inner?.className).toContain("custom-class");
  });
});
