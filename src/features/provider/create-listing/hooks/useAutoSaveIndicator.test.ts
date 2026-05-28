import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoSaveIndicator } from "./useAutoSaveIndicator";

describe("useAutoSaveIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("returns saved on first render", () => {
      const { result } = renderHook(() => useAutoSaveIndicator([]));

      expect(result.current.status).toBe("saved");
    });

    it("does not transition to saving on the first render even with a non-empty watched array", () => {
      const { result } = renderHook(() => useAutoSaveIndicator(["initial"]));

      expect(result.current.status).toBe("saved");
    });
  });

  describe("state transitions", () => {
    it("transitions to saving when a watched element changes", () => {
      let value = "a";
      const { result, rerender } = renderHook(() =>
        useAutoSaveIndicator([value]),
      );

      value = "b";
      rerender();

      expect(result.current.status).toBe("saving");
    });

    it("returns to saved after 700ms", () => {
      let value = "a";
      const { result, rerender } = renderHook(() =>
        useAutoSaveIndicator([value]),
      );

      value = "b";
      rerender();
      expect(result.current.status).toBe("saving");

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(result.current.status).toBe("saved");
    });

    it("does not return to saved before 700ms have elapsed", () => {
      let value = "a";
      const { result, rerender } = renderHook(() =>
        useAutoSaveIndicator([value]),
      );

      value = "b";
      rerender();

      act(() => {
        vi.advanceTimersByTime(699);
      });

      expect(result.current.status).toBe("saving");
    });

    it("resets the 700ms timer when watched changes again before it fires", () => {
      let value = "a";
      const { result, rerender } = renderHook(() =>
        useAutoSaveIndicator([value]),
      );

      value = "b";
      rerender();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      value = "c";
      rerender();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.status).toBe("saving");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.status).toBe("saved");
    });

    it("does not transition to saving when the same value is passed again", () => {
      const { result, rerender } = renderHook(() =>
        useAutoSaveIndicator(["same"]),
      );

      rerender();
      rerender();

      expect(result.current.status).toBe("saved");
    });
  });

  describe("cleanup", () => {
    it("clears the timeout on unmount", () => {
      const clearSpy = vi.spyOn(window, "clearTimeout");
      let value = "a";
      const { rerender, unmount } = renderHook(() =>
        useAutoSaveIndicator([value]),
      );

      value = "b";
      rerender();

      unmount();

      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });
});
