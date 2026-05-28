import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveStepFromScroll } from "./useActiveStepFromScroll";

const STEP_IDS = ["step-a", "step-b", "step-c"] as const;

function makeElement(id: string): HTMLElement {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function stubTop(el: HTMLElement, top: number): void {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 100,
    left: 0,
    right: 100,
    height: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

describe("useActiveStepFromScroll", () => {
  let el0!: HTMLElement;
  let el1!: HTMLElement;
  let el2!: HTMLElement;

  beforeEach(() => {
    el0 = makeElement("step-a");
    el1 = makeElement("step-b");
    el2 = makeElement("step-c");
  });

  afterEach(() => {
    el0.remove();
    el1.remove();
    el2.remove();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns the first stepId before any scroll", () => {
      stubTop(el0, 300);
      stubTop(el1, 400);
      stubTop(el2, 500);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      expect(result.current).toBe("step-a");
    });
  });

  describe("scroll detection", () => {
    it("activates a step when its top is strictly below 200", () => {
      stubTop(el0, 100);
      stubTop(el1, 300);
      stubTop(el2, 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("does not activate a step when its top is exactly 200", () => {
      stubTop(el0, 200);
      stubTop(el1, 300);
      stubTop(el2, 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("selects the last step that qualifies when multiple steps are below the threshold", () => {
      stubTop(el0, 50);
      stubTop(el1, 150);
      stubTop(el2, 350);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-b");
    });

    it("returns the first stepId when all steps are at or above the threshold", () => {
      stubTop(el0, 200);
      stubTop(el1, 300);
      stubTop(el2, 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("updates the active step as scroll position changes", () => {
      stubTop(el0, 100);
      stubTop(el1, 300);
      stubTop(el2, 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(result.current).toBe("step-a");

      stubTop(el1, 150);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(result.current).toBe("step-b");
    });
  });

  describe("cleanup", () => {
    it("removes the scroll event listener on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useActiveStepFromScroll(STEP_IDS));
      unmount();

      expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    });
  });

  describe("missing elements", () => {
    it("skips step ids that have no corresponding DOM element", () => {
      const missing = ["step-a", "ghost-id"] as const;
      const el = document.createElement("div");
      el.id = "step-a";
      document.body.appendChild(el);
      stubTop(el, 100);

      const { result } = renderHook(() => useActiveStepFromScroll(missing));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
      el.remove();
    });
  });
});
