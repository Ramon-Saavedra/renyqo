import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ACCENT_STORAGE_KEY, DEFAULT_ACCENT } from "../copy/dashboard";
import { setStoredAccent, useAccent } from "./useAccent";

describe("useAccent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the default accent when storage is empty", () => {
    const { result } = renderHook(() => useAccent());

    expect(result.current).toBe(DEFAULT_ACCENT);
  });

  it("returns the stored accent when it is valid", () => {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, "salbei");

    const { result } = renderHook(() => useAccent());

    expect(result.current).toBe("salbei");
  });

  it("ignores invalid stored accent values", () => {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, "invalid");

    const { result } = renderHook(() => useAccent());

    expect(result.current).toBe(DEFAULT_ACCENT);
  });

  it("updates subscribers when the stored accent changes", () => {
    const { result } = renderHook(() => useAccent());

    act(() => {
      setStoredAccent("flieder");
    });

    expect(window.localStorage.getItem(ACCENT_STORAGE_KEY)).toBe("flieder");
    expect(result.current).toBe("flieder");
  });
});
