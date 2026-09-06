import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFilterCustomValue } from "./useFilterCustomValue";

const OPTIONS = [
  { value: null, label: "Egal" },
  { value: 800, label: "bis 800 €" },
  { value: 1000, label: "bis 1.000 €" },
] as const;

describe("useFilterCustomValue", () => {
  it("starts in custom mode when the value is not a preset", () => {
    const { result } = renderHook(() =>
      useFilterCustomValue(1150, OPTIONS, vi.fn()),
    );
    expect(result.current.customMode).toBe(true);
    expect(result.current.draft).toBe("1150");
  });

  it("starts in preset mode for preset values", () => {
    const { result } = renderHook(() =>
      useFilterCustomValue(800, OPTIONS, vi.fn()),
    );
    expect(result.current.customMode).toBe(false);
    expect(result.current.draft).toBe("");
  });

  it("replaces custom state when a preset is selected", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterCustomValue(1150, OPTIONS, onChange),
    );

    act(() => {
      result.current.selectPreset(800);
    });

    expect(result.current.customMode).toBe(false);
    expect(result.current.draft).toBe("");
    expect(onChange).toHaveBeenCalledWith(800);
  });

  it("commits a valid custom integer and ignores invalid input", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterCustomValue(null, OPTIONS, onChange),
    );

    act(() => {
      result.current.selectCustom();
      result.current.setDraft("1150");
    });
    act(() => {
      result.current.commit();
    });
    expect(onChange).toHaveBeenCalledWith(1150);

    onChange.mockClear();
    act(() => {
      result.current.selectCustom();
      result.current.setDraft("0");
    });
    act(() => {
      result.current.commit();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits empty input as null", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterCustomValue(1150, OPTIONS, onChange),
    );

    act(() => {
      result.current.setDraft("");
    });
    act(() => {
      result.current.commit();
    });
    expect(onChange).toHaveBeenCalledWith(null);
    expect(result.current.customMode).toBe(false);
  });

  it("syncs custom mode when the committed value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFilterCustomValue(value, OPTIONS, vi.fn()),
      { initialProps: { value: 1150 as number | null } },
    );

    expect(result.current.customMode).toBe(true);
    expect(result.current.draft).toBe("1150");

    rerender({ value: 800 });
    expect(result.current.customMode).toBe(false);
    expect(result.current.draft).toBe("");

    rerender({ value: 900 });
    expect(result.current.customMode).toBe(true);
    expect(result.current.draft).toBe("900");
  });
});
