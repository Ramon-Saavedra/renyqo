import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  createListingDraft,
  uploadListingImage,
  updateListing,
} from "@/lib/api/listings";
import { useCreateListing } from "@/features/provider/create-listing/hooks/useCreateListing";
import { INITIAL_DRAFT } from "@/features/provider/create-listing/hooks/useListingDraft";
import { WorkspaceFixture, workspaceA } from "./testing/workspace-fixture";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/api/listings", () => ({
  createListingDraft: vi.fn(),
  uploadListingImage: vi.fn(),
  updateListing: vi.fn(),
  publishListing: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("listing creation compatibility", () => {
  it("reuses the same commandId after an uncertain create failure", async () => {
    vi.mocked(createListingDraft)
      .mockRejectedValueOnce(new ApiError(0, "network"))
      .mockResolvedValueOnce({ id: "listing" });
    const { result } = renderHook(() => useCreateListing(), {
      wrapper: WorkspaceFixture,
    });
    const draft = { ...INITIAL_DRAFT, city: "Berlin", zip: "10115" };
    await act(async () => {
      await result.current.saveDraft(draft, "Titel", { redirectTo: false });
    });
    await act(async () => {
      await result.current.saveDraft(draft, "Titel", { redirectTo: false });
    });
    const calls = vi.mocked(createListingDraft).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]![0].commandId).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[1]![0].commandId).toBe(calls[0]![0].commandId);
    expect(new Headers(calls[0]![1]?.headers).get("x-workspace-id")).toBe(
      workspaceA,
    );
  });
  it("retains the new listing ID before an image fails and retries media without creating another listing", async () => {
    vi.mocked(createListingDraft).mockResolvedValue({ id: "listing" });
    vi.mocked(uploadListingImage)
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockResolvedValueOnce({
        id: "image",
        secureUrl: "https://example.com/image.jpg",
        position: 1,
        isCover: true,
      });
    vi.mocked(updateListing).mockResolvedValue(undefined);
    const { result } = renderHook(() => useCreateListing(), {
      wrapper: WorkspaceFixture,
    });
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const draft = {
      ...INITIAL_DRAFT,
      city: "Berlin",
      photos: [{ id: "photo", src: "blob:photo", file }],
    };
    await act(async () => {
      expect(
        await result.current.saveDraft(draft, "Titel", { redirectTo: false }),
      ).toBe("error");
    });
    await act(async () => {
      expect(
        await result.current.saveDraft(draft, "Titel", { redirectTo: false }),
      ).toBe("saved");
    });
    expect(createListingDraft).toHaveBeenCalledTimes(1);
    expect(uploadListingImage).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(uploadListingImage).mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      vi.mocked(createListingDraft).mock.invocationCallOrder[0]!,
    );
  });
});
