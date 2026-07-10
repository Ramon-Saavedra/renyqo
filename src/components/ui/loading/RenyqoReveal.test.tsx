import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenyqoReveal } from "./RenyqoReveal";

describe("RenyqoReveal", () => {
  it("shows the skeleton veil and hides real content while loading (standalone)", () => {
    const { container } = render(
      <RenyqoReveal loading skeleton={<span>SKELETON</span>}>
        <span>REAL</span>
      </RenyqoReveal>,
    );

    expect(screen.getByText("SKELETON")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("REAL")).toBeNull();
    expect(container.querySelector(".veil.veil-static")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      container.querySelector(".reveal-wrap")?.classList.contains("is-loaded"),
    ).toBe(false);
  });

  it("reveals real content and marks the wrapper loaded when done", () => {
    const { container } = render(
      <RenyqoReveal loading={false} skeleton={<span>SKELETON</span>}>
        <span>REAL</span>
      </RenyqoReveal>,
    );

    expect(screen.getByText("REAL")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("SKELETON")).toBeNull();
    expect(
      container.querySelector(".reveal-wrap")?.classList.contains("is-loaded"),
    ).toBe(true);
  });

  it("keeps both layers mounted in overlay mode and applies the stagger var", () => {
    const { container } = render(
      <RenyqoReveal
        loading
        overlay
        vertical
        stagger={1.1}
        skeleton={<span>SKELETON</span>}
      >
        <span>REAL</span>
      </RenyqoReveal>,
    );

    expect(screen.getByText("SKELETON")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("REAL")).toBeInstanceOf(HTMLElement);
    const wrap = container.querySelector(".reveal-wrap") as HTMLElement;
    expect(wrap.style.getPropertyValue("--rq-stagger")).toBe("1.1s");
    expect(container.querySelector(".veil.veil-v")).toBeInstanceOf(HTMLElement);
  });
});
