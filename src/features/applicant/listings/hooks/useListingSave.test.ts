import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { saveListing, unsaveListing } from "../api/listing-saved";
import { useListingSave } from "./useListingSave";

vi.mock("../api/listing-saved", () => ({
  saveListing: vi.fn(),
  unsaveListing: vi.fn(),
}));

const saved = {
  saved: true as const,
  savedAt: "2026-09-05T12:00:00.000Z",
};

const unsaved = {
  saved: false as const,
  savedAt: null,
};

describe("useListingSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves with PUT when the listing is not saved", async () => {
    vi.mocked(saveListing).mockResolvedValue(saved);
    const { result } = renderHook(() => useListingSave("listing-1", false));

    await act(async () => {
      await result.current.toggle();
    });

    expect(saveListing).toHaveBeenCalledWith("listing-1");
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(result.current.saved).toBe(true);
    expect(result.current.status).toBe("idle");
  });

  it("unsaves with DELETE when the listing is saved", async () => {
    vi.mocked(unsaveListing).mockResolvedValue(unsaved);
    const { result } = renderHook(() => useListingSave("listing-1", true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(unsaveListing).toHaveBeenCalledWith("listing-1");
    expect(saveListing).not.toHaveBeenCalled();
    expect(result.current.saved).toBe(false);
  });

  it("prevents concurrent save requests", async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(saveListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(saved);
      }),
    );
    const { result } = renderHook(() => useListingSave("listing-1", false));

    await act(async () => {
      void result.current.toggle();
      void result.current.toggle();
    });
    expect(saveListing).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.();
    });
    expect(result.current.saved).toBe(true);
  });

  it("keeps the previous saved state when the request fails", async () => {
    vi.mocked(saveListing).mockRejectedValue(new ApiError(500, "fail"));
    const { result } = renderHook(() => useListingSave("listing-1", false));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.saved).toBe(false);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Das Objekt konnte nicht gemerkt werden.",
    );
  });

  it("uses unsave copy when removing a saved listing fails", async () => {
    vi.mocked(unsaveListing).mockRejectedValue(new ApiError(500, "fail"));
    const { result } = renderHook(() => useListingSave("listing-1", true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.saved).toBe(true);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Das Objekt konnte nicht von den Gemerkten entfernt werden.",
    );
  });

  it("uses unsave auth copy on 401 while unsaving", async () => {
    vi.mocked(unsaveListing).mockRejectedValue(new ApiError(401, "auth"));
    const { result } = renderHook(() => useListingSave("listing-1", true));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.saved).toBe(true);
    expect(result.current.error).toBe(
      "Bitte melde dich an, um dieses Objekt von den Gemerkten zu entfernen.",
    );
  });

  it("uses save 403 and 404 copy", async () => {
    const { result, rerender } = renderHook(
      ({ listingId }) => useListingSave(listingId, false),
      { initialProps: { listingId: "listing-1" } },
    );

    vi.mocked(saveListing).mockRejectedValue(new ApiError(403, "forbidden"));
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.saved).toBe(false);
    expect(result.current.error).toBe(
      "Du kannst dieses Objekt derzeit nicht merken.",
    );

    rerender({ listingId: "listing-2" });
    vi.mocked(saveListing).mockRejectedValue(new ApiError(404, "missing"));
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.saved).toBe(false);
    expect(result.current.error).toBe(
      "Dieses Objekt ist nicht mehr verfügbar.",
    );
  });

  it("uses unsave 403 and 404 copy", async () => {
    vi.mocked(unsaveListing).mockRejectedValue(new ApiError(403, "forbidden"));
    const { result, rerender } = renderHook(
      ({ listingId }) => useListingSave(listingId, true),
      { initialProps: { listingId: "listing-1" } },
    );

    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.saved).toBe(true);
    expect(result.current.error).toBe(
      "Du kannst dieses Objekt derzeit nicht von den Gemerkten entfernen.",
    );

    rerender({ listingId: "listing-2" });
    vi.mocked(unsaveListing).mockRejectedValue(new ApiError(404, "missing"));
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.saved).toBe(true);
    expect(result.current.error).toBe(
      "Dieses Objekt ist nicht mehr verfügbar.",
    );
  });

  it("does not apply a save result after the listing id changes", async () => {
    let resolveRequest: ((value: typeof saved) => void) | undefined;
    vi.mocked(saveListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result, rerender } = renderHook(
      ({ listingId }) => useListingSave(listingId, false),
      { initialProps: { listingId: "listing-1" } },
    );

    await act(async () => {
      void result.current.toggle();
    });

    rerender({ listingId: "listing-2" });

    await act(async () => {
      resolveRequest?.(saved);
    });

    expect(result.current.saved).toBe(false);
    expect(result.current.status).toBe("idle");
  });
});
