import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Candidate } from "../types";
import { CandidateLane } from "./CandidateLane";

const candidate: Candidate = {
  id: "candidate-1",
  objectId: "object-1",
  initials: "AL",
  name: "Anna Lehmann",
  household: "2 Personen",
  warnings: [],
};

class ResizeObserverMock {
  private target: Element | null = null;

  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {
    this.target = null;
  }

  disconnect() {
    this.target = null;
  }

  notify(width: number) {
    if (!this.target) return;
    const entry: ResizeObserverEntry = {
      borderBoxSize: [],
      contentBoxSize: [],
      contentRect: new DOMRectReadOnly(0, 0, width, 0),
      devicePixelContentBoxSize: [],
      target: this.target,
    };
    this.callback([entry], this);
  }
}

describe("CandidateLane", () => {
  let observers: ResizeObserverMock[];

  beforeEach(() => {
    observers = [];
    vi.stubGlobal(
      "ResizeObserver",
      class extends ResizeObserverMock {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          observers.push(this);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the light palette when requested", () => {
    const { container } = render(
      <CandidateLane actives={[candidate]} waitingCount={0} theme="light" />,
    );

    const lane = container.firstElementChild;
    if (!(lane instanceof HTMLElement))
      throw new Error("Candidate lane is missing");

    expect(lane.style.getPropertyValue("--rq-lane-edge")).toBe("#E5E5E5");
  });

  it("announces waiting count changes", () => {
    const { rerender } = render(
      <CandidateLane actives={[candidate]} waitingCount={1} theme="dark" />,
    );

    const status = screen.getByRole("status", { name: "+1 wartet" });
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");

    rerender(
      <CandidateLane actives={[candidate]} waitingCount={2} theme="dark" />,
    );

    expect(screen.getByRole("status", { name: "+2 warten" })).not.toBeNull();
  });

  it("does not announce a waiting status when the count is unavailable", () => {
    render(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        announceWaitingStatus={false}
        theme="dark"
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("preserves responsive lane direction and chat visibility", () => {
    const { container } = render(
      <CandidateLane actives={[candidate]} waitingCount={0} theme="dark" />,
    );

    const observer = observers[0];
    if (!observer) throw new Error("Resize observer is missing");

    act(() => {
      observer.notify(800);
    });

    const fields = Array.from(container.querySelectorAll("div")).find(
      (element) => element.style.alignItems === "stretch",
    );
    const lane = container.firstElementChild;
    if (!(lane instanceof HTMLElement))
      throw new Error("Candidate lane is missing");
    const header = screen.getByText("Anna Lehmann").parentElement;
    const chatIcon = header?.querySelector("svg");

    expect(fields?.style.flexDirection).toBe("row");
    expect(chatIcon?.style.display).toBe("none");

    act(() => {
      observer.notify(640);
    });

    expect(fields?.style.flexDirection).toBe("column");
    expect(chatIcon?.style.display).toBe("block");
    expect(lane.style.getPropertyValue("--rq-teaser-h")).toBe("104px");
  });
});
