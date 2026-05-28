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
  let elements: HTMLElement[];

  beforeEach(() => {
    elements = STEP_IDS.map(makeElement);
  });

  afterEach(() => {
    for (const el of elements) {
      el.remove();
    }
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns the first stepId before any scroll", () => {
      stubTop(elements[0], 300);
      stubTop(elements[1], 400);
      stubTop(elements[2], 500);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      expect(result.current).toBe("step-a");
    });
  });

  describe("scroll detection", () => {
    it("activates a step when its top is strictly below 200", () => {
      stubTop(elements[0], 100);
      stubTop(elements[1], 300);
      stubTop(elements[2], 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("does not activate a step when its top is exactly 200", () => {
      stubTop(elements[0], 200);
      stubTop(elements[1], 300);
      stubTop(elements[2], 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("selects the last step that qualifies when multiple steps are below the threshold", () => {
      stubTop(elements[0], 50);
      stubTop(elements[1], 150);
      stubTop(elements[2], 350);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-b");
    });

    it("returns the first stepId when all steps are at or above the threshold", () => {
      stubTop(elements[0], 200);
      stubTop(elements[1], 300);
      stubTop(elements[2], 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe("step-a");
    });

    it("updates the active step as scroll position changes", () => {
      stubTop(elements[0], 100);
      stubTop(elements[1], 300);
      stubTop(elements[2], 400);

      const { result } = renderHook(() => useActiveStepFromScroll(STEP_IDS));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(result.current).toBe("step-a");

      stubTop(elements[1], 150);

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
