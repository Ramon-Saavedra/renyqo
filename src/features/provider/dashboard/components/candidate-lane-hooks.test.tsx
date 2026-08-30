import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Candidate } from "../types";
import { useLaneRows } from "./candidate-lane-hooks";

const firstCandidate: Candidate = {
  id: "candidate-1",
  objectId: "object-1",
  initials: "AL",
  name: "Anna Lehmann",
  household: "2 Personen",
  warnings: [],
};

const secondCandidate: Candidate = {
  id: "candidate-2",
  objectId: "object-1",
  initials: "BS",
  name: "Bruno Sommer",
  household: "1 Person",
  warnings: [],
};

describe("useLaneRows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the received FIFO order and settles a new row after its entry animation", () => {
    const { result, rerender } = renderHook(
      ({ actives }: { actives: readonly Candidate[] }) => useLaneRows(actives),
      { initialProps: { actives: [firstCandidate] } },
    );

    rerender({ actives: [firstCandidate, secondCandidate] });

    expect(result.current.map((row) => row.item.id)).toEqual([
      "candidate-1",
      "candidate-2",
    ]);
    expect(result.current[1]?.state).toBe("entering");

    act(() => {
      vi.advanceTimersByTime(560);
    });

    expect(result.current[1]?.state).toBe("idle");
  });

  it("cancels a removed candidate timer before the same candidate re-enters", () => {
    const { result, rerender } = renderHook(
      ({ actives }: { actives: readonly Candidate[] }) => useLaneRows(actives),
      { initialProps: { actives: [firstCandidate] } },
    );

    rerender({ actives: [firstCandidate, secondCandidate] });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ actives: [firstCandidate] });
    rerender({ actives: [firstCandidate, secondCandidate] });

    act(() => {
      vi.advanceTimersByTime(460);
    });

    expect(result.current[1]?.state).toBe("entering");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current[1]?.state).toBe("idle");
  });
});
