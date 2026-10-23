import { describe, expect, it, vi } from "vitest";
import { catchUpMessages } from "./catch-up";

function message(id: string, sequence: number) {
  return { id, sequence };
}

describe("catchUpMessages", () => {
  it("pages forward from the contiguous cursor and merges by id", async () => {
    const loadFromStart = vi.fn();
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({
        messages: [message("m3", 3), message("m4", 4)],
        hasMore: true,
        nextAfterSequence: 4,
      })
      .mockResolvedValueOnce({
        messages: [message("m4", 4), message("m5", 5)],
        hasMore: false,
        nextAfterSequence: null,
      });

    const result = await catchUpMessages(
      [message("m1", 1), message("m2", 2)],
      loadFromStart,
      loadPage,
      new AbortController().signal,
    );

    expect(loadFromStart).not.toHaveBeenCalled();
    expect(loadPage).toHaveBeenNthCalledWith(1, 2, expect.any(AbortSignal));
    expect(loadPage).toHaveBeenNthCalledWith(2, 4, expect.any(AbortSignal));
    expect(result.reloadedFromStart).toBe(false);
    expect(result.messages.map((item) => item.id)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
    ]);
  });

  it("reloads from the start when the loaded range has a hole", async () => {
    const loadFromStart = vi
      .fn()
      .mockResolvedValue([
        message("m1", 1),
        message("m2", 2),
        message("m3", 3),
      ]);
    const loadPage = vi.fn();

    const result = await catchUpMessages(
      [message("m1", 1), message("m3", 3)],
      loadFromStart,
      loadPage,
      new AbortController().signal,
    );

    expect(loadPage).not.toHaveBeenCalled();
    expect(loadFromStart).toHaveBeenCalledOnce();
    expect(result.reloadedFromStart).toBe(true);
    expect(result.messages.map((item) => item.sequence)).toEqual([1, 2, 3]);
  });

  it("reloads from the start when a later page breaks contiguity", async () => {
    const loadFromStart = vi.fn().mockResolvedValue([message("m1", 1)]);
    const loadPage = vi.fn().mockResolvedValue({
      messages: [message("m4", 4)],
      hasMore: false,
      nextAfterSequence: null,
    });

    const result = await catchUpMessages(
      [message("m1", 1), message("m2", 2)],
      loadFromStart,
      loadPage,
      new AbortController().signal,
    );

    expect(loadPage).toHaveBeenCalledOnce();
    expect(result.reloadedFromStart).toBe(true);
    expect(result.messages).toEqual([message("m1", 1)]);
  });

  it("loads an empty thread from the start without marking a hole", async () => {
    const loadFromStart = vi.fn().mockResolvedValue([message("m1", 1)]);
    const result = await catchUpMessages(
      [],
      loadFromStart,
      vi.fn(),
      new AbortController().signal,
    );
    expect(result.reloadedFromStart).toBe(false);
    expect(result.messages).toEqual([message("m1", 1)]);
  });
});
