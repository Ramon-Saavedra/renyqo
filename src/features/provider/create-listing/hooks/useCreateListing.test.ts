import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { INITIAL_DRAFT } from "./useListingDraft";
import type { ListingDraft, ListingPhoto } from "./useListingDraft";
import { useCreateListing } from "./useCreateListing";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api/listings", () => ({
  createListingDraft: vi.fn(),
  publishListing: vi.fn(),
}));

import { createListingDraft, publishListing } from "@/lib/api/listings";

const PHOTO: ListingPhoto = { id: "p1", src: "data:image/svg+xml;test" };

const DRAFT_SAVE_VALID: ListingDraft = {
  ...INITIAL_DRAFT,
  city: "Berlin",
  zip: "10115",
};

const VALID_DRAFT: ListingDraft = {
  ...INITIAL_DRAFT,
  city: "Berlin",
  zip: "10115",
  street: "Musterstraße 1",
  area: "65",
  rooms: "3",
  bedrooms: 1,
  price: "1100",
  availableFrom: "2026-07-01",
  photos: [PHOTO],
  legalAccepted: true,
};

describe("useCreateListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with idle status, null error and empty fieldErrors", () => {
      const { result } = renderHook(() => useCreateListing());

      expect(result.current.submitStatus).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.fieldErrors).toEqual({});
    });
  });

  describe("clearFieldError", () => {
    it("removes a specific field error without affecting others", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(INITIAL_DRAFT, "Titel");
      });

      expect(result.current.fieldErrors.city).toBeTruthy();

      act(() => {
        result.current.clearFieldError("city");
      });

      expect(result.current.fieldErrors.city).toBeUndefined();
      expect(result.current.fieldErrors.zip).toBeTruthy();
    });
  });

  describe("saveDraft — zod validation", () => {
    it("sets fieldErrors.city and skips API when city is empty", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(INITIAL_DRAFT, "Titel");
      });

      expect(result.current.fieldErrors.city).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("sets fieldErrors.zip and skips API when zip is empty", async () => {
      const { result } = renderHook(() => useCreateListing());
      const draft = { ...INITIAL_DRAFT, city: "Berlin", zip: "" };

      await act(async () => {
        await result.current.saveDraft(draft, "Titel");
      });

      expect(result.current.fieldErrors.zip).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("clears fieldErrors and calls API when city and zip are present", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.fieldErrors).toEqual({});
      expect(createListingDraft).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveDraft — API success", () => {
    it("calls createListingDraft with mapped DTO fields", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(VALID_DRAFT, "Mein Titel");
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          city: "Berlin",
          zip: "10115",
          street: "Musterstraße 1",
          objectType: "APARTMENT",
          livingArea: 65,
          rooms: 3,
          coldRent: 1100,
          schufaRequired: false,
          incomeProofRequired: false,
          title: "Mein Titel",
        }),
      );
    });

    it("does not call createListingDraft a second time when draftId is already set", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
    });

    it("returns to idle status with no error after success", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.submitStatus).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("maps street to undefined when empty", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, street: "" },
          "Titel",
        );
      });

      const payload = vi.mocked(createListingDraft).mock.calls[0]?.[0];
      expect(payload?.street).toBeUndefined();
    });
  });

  describe("saveDraft — API errors", () => {
    it("sets network error message on status 0", async () => {
      vi.mocked(createListingDraft).mockRejectedValue(new ApiError(0, ""));
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.error).toMatch(/Netzwerkfehler/);
    });

    it("sets generic saving error on unexpected status", async () => {
      vi.mocked(createListingDraft).mockRejectedValue(
        new ApiError(500, "server error"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.error).toMatch(/Fehler beim Speichern/);
    });

    it("sets generic error on 400 with unrecognized field message", async () => {
      vi.mocked(createListingDraft).mockRejectedValue(
        new ApiError(400, "unexpected field xyz"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.error).toBeTruthy();
    });

    it("returns to idle status after error", async () => {
      vi.mocked(createListingDraft).mockRejectedValue(
        new ApiError(500, "server error"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(result.current.submitStatus).toBe("idle");
    });
  });

  describe("publish — zod validation", () => {
    it("sets fieldErrors.street when street is empty on publish", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish({ ...VALID_DRAFT, street: "" }, "Titel");
      });

      expect(result.current.fieldErrors.street).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("sets fieldErrors.bedrooms when bedrooms is null on publish", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(
          { ...VALID_DRAFT, bedrooms: null },
          "Titel",
        );
      });

      expect(result.current.fieldErrors.bedrooms).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("sets fieldErrors.legalAccepted when not accepted", async () => {      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(
          { ...VALID_DRAFT, legalAccepted: false },
          "Titel",
        );
      });

      expect(result.current.fieldErrors.legalAccepted).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("sets fieldErrors.photos when photos array is empty", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish({ ...VALID_DRAFT, photos: [] }, "Titel");
      });

      expect(result.current.fieldErrors.photos).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("calls API when all required fields are valid", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      vi.mocked(publishListing).mockResolvedValue(undefined);
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(publishListing).toHaveBeenCalledWith("draft-1");
    });
  });

  describe("publish — API success", () => {
    it("creates draft, publishes and redirects when no draft exists", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "new-draft" });
      vi.mocked(publishListing).mockResolvedValue(undefined);
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(publishListing).toHaveBeenCalledWith("new-draft");
      expect(mockPush).toHaveBeenCalledWith("/provider/listings");
    });

    it("skips createListingDraft and reuses existing draft id on publish", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "existing-draft" });
      vi.mocked(publishListing).mockResolvedValue(undefined);
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(publishListing).toHaveBeenCalledWith("existing-draft");
    });
  });

  describe("publish — API errors", () => {
    it("sets auth error message on 401", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      vi.mocked(publishListing).mockRejectedValue(
        new ApiError(401, "unauthorized"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(result.current.error).toMatch(/autorisiert/);
    });

    it("sets network error message on status 0", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      vi.mocked(publishListing).mockRejectedValue(new ApiError(0, ""));
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(result.current.error).toMatch(/Netzwerkfehler/);
    });

    it("sets generic publishing error on unexpected status", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      vi.mocked(publishListing).mockRejectedValue(
        new ApiError(500, "server error"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(result.current.error).toMatch(/Veröffentlichen/);
    });

    it("returns to idle status after publish error", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      vi.mocked(publishListing).mockRejectedValue(
        new ApiError(500, "server error"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(result.current.submitStatus).toBe("idle");
    });
  });

  describe("DTO mapping", () => {
    it.each([
      ["wohnung", "APARTMENT"],
      ["haus", "HOUSE"],
      ["zimmer", "ROOM"],
    ] as const)("maps objectType '%s' to '%s'", async (input, expected) => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, objectType: input },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ objectType: expected }),
      );
    });

    it("maps rooms '6+' to 6", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, rooms: "6+" },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ rooms: 6 }),
      );
    });

    it("maps schufa 'erforderlich' to schufaRequired true", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, schufa: "erforderlich" },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ schufaRequired: true }),
      );
    });

    it.each([
      ["erlaubt", "ALLOWED"],
      ["keine", "PREFER_NOT"],
      ["absprache", "BY_ARRANGEMENT"],
    ] as const)(
      "maps pets '%s' to petsPolicy '%s'",
      async (input, expected) => {
        vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
        const { result } = renderHook(() => useCreateListing());

        await act(async () => {
          await result.current.saveDraft(
            { ...DRAFT_SAVE_VALID, pets: input },
            "Titel",
          );
        });

        expect(createListingDraft).toHaveBeenCalledWith(
          expect.objectContaining({ petsPolicy: expected }),
        );
      },
    );

    it.each([
      ["erlaubt", "ALLOWED"],
      ["absprache", "BY_ARRANGEMENT"],
    ] as const)(
      "maps smoking '%s' to smokingPolicy '%s'",
      async (input, expected) => {
        vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
        const { result } = renderHook(() => useCreateListing());

        await act(async () => {
          await result.current.saveDraft(
            { ...DRAFT_SAVE_VALID, smoking: input },
            "Titel",
          );
        });

        expect(createListingDraft).toHaveBeenCalledWith(
          expect.objectContaining({ smokingPolicy: expected }),
        );
      },
    );

    it("computes suitableForPeopleCount from adults and kids", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, adults: 2, kids: 1 },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ suitableForPeopleCount: 3 }),
      );
    });

    it("sets suitableForPeopleCount to null when adults and kids are both null", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, adults: null, kids: null },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ suitableForPeopleCount: null }),
      );
    });
  });
});
