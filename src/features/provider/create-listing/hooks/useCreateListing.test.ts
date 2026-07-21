import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { INITIAL_DRAFT } from "./useListingDraft";
import type { ListingDraft, ListingPhoto } from "./useListingDraft";
import { useCreateListing, type DraftSaveResult } from "./useCreateListing";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api/listings", () => ({
  createListingDraft: vi.fn(),
  publishListing: vi.fn(),
  updateListing: vi.fn(),
  uploadListingImage: vi.fn(),
}));

import {
  createListingDraft,
  publishListing,
  updateListing,
  uploadListingImage,
} from "@/lib/api/listings";

const PHOTO_FILE = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
const PHOTO: ListingPhoto = {
  id: "p1",
  src: "data:image/svg+xml;test",
  file: PHOTO_FILE,
};

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
    vi.mocked(updateListing).mockResolvedValue(undefined);
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
        await result.current.publish(
          { ...VALID_DRAFT, city: "", zip: "" },
          "Titel",
        );
      });

      expect(result.current.fieldErrors.city).toBeTruthy();

      act(() => {
        result.current.clearFieldError("city");
      });

      expect(result.current.fieldErrors.city).toBeUndefined();
      expect(result.current.fieldErrors.zip).toBeTruthy();
    });
  });

  describe("saveDraft — partial content", () => {
    it("returns empty and skips API when no meaningful content exists", async () => {
      const { result } = renderHook(() => useCreateListing());
      let saved: DraftSaveResult | undefined;

      await act(async () => {
        saved = await result.current.saveDraft(INITIAL_DRAFT, "Titel");
      });

      expect(saved).toBe("empty");
      expect(result.current.error).toBe("Es gibt noch nichts zu speichern.");
      expect(result.current.fieldErrors).toEqual({});
      expect(createListingDraft).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does not count default objectType alone as meaningful content", async () => {
      const { result } = renderHook(() => useCreateListing());
      let saved: DraftSaveResult | undefined;

      await act(async () => {
        saved = await result.current.saveDraft(
          { ...INITIAL_DRAFT, objectType: "wohnung" },
          "Wohnung",
        );
      });

      expect(saved).toBe("empty");
      expect(result.current.error).toBe("Es gibt noch nichts zu speichern.");
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("allows draft save when only city is present", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());
      let saved: DraftSaveResult | undefined;

      await act(async () => {
        saved = await result.current.saveDraft(
          { ...INITIAL_DRAFT, city: "Berlin" },
          "Wohnung in Berlin",
        );
      });

      expect(saved).toBe("saved");
      expect(result.current.fieldErrors).toEqual({});
      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          city: "Berlin",
          title: "Wohnung in Berlin",
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/provider/listings");
    });

    it("omits empty and invalid optional fields from draft payload", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          {
            ...INITIAL_DRAFT,
            city: "Berlin",
            street: "   ",
            additionalCosts: "abc",
            deposit: "",
            availableFrom: "2026-02-31",
            minIncome: "abc",
          },
          "Wohnung in Berlin",
        );
      });

      const payload = vi.mocked(createListingDraft).mock.calls[0]?.[0];
      expect(payload?.street).toBeUndefined();
      expect(payload?.additionalCosts).toBeUndefined();
      expect(payload?.depositMonths).toBeUndefined();
      expect(payload?.deposit).toBeUndefined();
      expect(payload?.availableFrom).toBeUndefined();
      expect(payload?.minimumHouseholdNetIncome).toBeUndefined();
    });

    it("converts valid availableFrom to ISO 8601 for draft save", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...INITIAL_DRAFT, city: "Berlin", availableFrom: "2026-07-01" },
          "Wohnung in Berlin",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          availableFrom: "2026-07-01T00:00:00.000Z",
        }),
      );
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
          depositMonths: 2,
          deposit: 2200,
          title: "Mein Titel",
        }),
        PHOTO_FILE,
      );
      expect(mockPush).toHaveBeenCalledWith("/provider/listings");
    });

    it("passes the first photo to createListingDraft and uploads remaining photos", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const secondFile = new File(["second"], "second.jpg", {
        type: "image/jpeg",
      });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          {
            ...VALID_DRAFT,
            photos: [PHOTO, { id: "p2", src: "blob:second", file: secondFile }],
          },
          "Mein Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.any(Object),
        PHOTO_FILE,
      );
      expect(uploadListingImage).toHaveBeenCalledWith("draft-1", secondFile);
    });

    it("does not upload additional images when only one photo exists", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(VALID_DRAFT, "Mein Titel");
      });

      expect(uploadListingImage).not.toHaveBeenCalled();
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

    it("updates an existing draft before saving it again", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, city: "Hamburg" },
          "Titel aktualisiert",
          { redirectTo: false },
        );
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(updateListing).toHaveBeenCalledWith(
        "draft-1",
        expect.objectContaining({ city: "Hamburg" }),
      );
    });

    it("stops saving when updating an existing draft fails", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      vi.mocked(updateListing).mockRejectedValue(
        new ApiError(500, "update failed"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, city: "Hamburg" },
          "Titel aktualisiert",
          { redirectTo: false },
        );
      });

      expect(result.current.error).toMatch(/Speichern/);
      expect(result.current.submitStatus).toBe("idle");
      expect(uploadListingImage).not.toHaveBeenCalled();
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

    it("redirects to a custom destination when provided", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "draft-1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel", {
          redirectTo: "/provider/dashboard",
        });
      });

      expect(mockPush).toHaveBeenCalledWith("/provider/dashboard");
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
      let saved: DraftSaveResult | undefined;

      await act(async () => {
        saved = await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });

      expect(saved).toBe("error");
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

    it("sets fieldErrors.legalAccepted when not accepted", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(
          { ...VALID_DRAFT, legalAccepted: false },
          "Titel",
        );
      });

      expect(result.current.fieldErrors.legalAccepted).toBeTruthy();
      expect(createListingDraft).not.toHaveBeenCalled();
    });

    it("sets fieldErrors.availableFrom when the date is impossible", async () => {
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(
          { ...VALID_DRAFT, availableFrom: "2026-02-31" },
          "Titel",
        );
      });

      expect(result.current.fieldErrors.availableFrom).toBeTruthy();
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
      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          availableFrom: "2026-07-01T00:00:00.000Z",
        }),
        PHOTO_FILE,
      );
      expect(publishListing).toHaveBeenCalledWith("draft-1");
    });
  });

  describe("publish — API success", () => {
    it("completes the create, save, edit and publish lifecycle", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "listing-1" });
      vi.mocked(publishListing).mockResolvedValue(undefined);
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Initial title", {
          redirectTo: false,
        });
      });
      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, city: "Hamburg" },
          "Updated title",
          { redirectTo: false },
        );
      });
      await act(async () => {
        await result.current.publish(
          { ...VALID_DRAFT, city: "Hamburg" },
          "Updated title",
        );
      });

      expect(createListingDraft).toHaveBeenCalledTimes(1);
      expect(updateListing).toHaveBeenCalledTimes(2);
      expect(updateListing).toHaveBeenNthCalledWith(
        1,
        "listing-1",
        expect.objectContaining({ city: "Hamburg" }),
      );
      expect(updateListing).toHaveBeenNthCalledWith(
        2,
        "listing-1",
        expect.objectContaining({ city: "Hamburg" }),
      );
      expect(uploadListingImage).toHaveBeenCalledWith("listing-1", PHOTO_FILE);
      expect(publishListing).toHaveBeenCalledWith("listing-1");

      const createOrder =
        vi.mocked(createListingDraft).mock.invocationCallOrder[0];
      const firstUpdateOrder =
        vi.mocked(updateListing).mock.invocationCallOrder[0];
      const secondUpdateOrder =
        vi.mocked(updateListing).mock.invocationCallOrder[1];
      const uploadOrder =
        vi.mocked(uploadListingImage).mock.invocationCallOrder[0];
      const publishOrder =
        vi.mocked(publishListing).mock.invocationCallOrder[0];

      expect(createOrder).toBeDefined();
      expect(firstUpdateOrder).toBeDefined();
      expect(secondUpdateOrder).toBeDefined();
      expect(uploadOrder).toBeDefined();
      expect(publishOrder).toBeDefined();
      expect(createOrder!).toBeLessThan(firstUpdateOrder!);
      expect(firstUpdateOrder!).toBeLessThan(secondUpdateOrder!);
      expect(secondUpdateOrder!).toBeLessThan(uploadOrder!);
      expect(uploadOrder!).toBeLessThan(publishOrder!);
    });

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

    it("uploads remaining photos before publishing a new listing", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "new-draft" });
      vi.mocked(publishListing).mockResolvedValue(undefined);
      const secondFile = new File(["second"], "second.jpg", {
        type: "image/jpeg",
      });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.publish(
          {
            ...VALID_DRAFT,
            photos: [PHOTO, { id: "p2", src: "blob:second", file: secondFile }],
          },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.any(Object),
        PHOTO_FILE,
      );
      expect(uploadListingImage).toHaveBeenCalledWith("new-draft", secondFile);
      const uploadOrder =
        vi.mocked(uploadListingImage).mock.invocationCallOrder[0];
      const publishOrder =
        vi.mocked(publishListing).mock.invocationCallOrder[0];
      expect(uploadOrder).toBeDefined();
      expect(publishOrder).toBeDefined();
      expect(uploadOrder!).toBeLessThan(publishOrder!);
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
      expect(updateListing).toHaveBeenCalledWith(
        "existing-draft",
        expect.objectContaining({ city: "Berlin" }),
      );
      expect(publishListing).toHaveBeenCalledWith("existing-draft");
      const updateOrder = vi.mocked(updateListing).mock.invocationCallOrder[0];
      const publishOrder =
        vi.mocked(publishListing).mock.invocationCallOrder[0];
      expect(updateOrder).toBeDefined();
      expect(publishOrder).toBeDefined();
      expect(updateOrder!).toBeLessThan(publishOrder!);
    });

    it("does not publish when updating an existing draft fails", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "existing-draft" });
      vi.mocked(updateListing).mockRejectedValue(
        new ApiError(500, "update failed"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(publishListing).not.toHaveBeenCalled();
      expect(result.current.error).toMatch(/Veröffentlichen/);
    });

    it("does not publish when uploading images fails after an update", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "existing-draft" });
      vi.mocked(uploadListingImage).mockRejectedValue(
        new ApiError(500, "upload failed"),
      );
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(DRAFT_SAVE_VALID, "Titel");
      });
      await act(async () => {
        await result.current.publish(VALID_DRAFT, "Titel");
      });

      expect(updateListing).toHaveBeenCalledWith(
        "existing-draft",
        expect.objectContaining({ city: "Berlin" }),
      );
      expect(publishListing).not.toHaveBeenCalled();
      expect(result.current.error).toMatch(/Veröffentlichen/);
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
      ["absprache", "BY_ARRANGEMENT"],
      ["keine", "PREFER_NOT"],
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

    it("omits petsPolicy when no pets option is selected", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, pets: "" },
          "Titel",
        );
      });

      const payload = vi.mocked(createListingDraft).mock.calls[0]?.[0];
      expect(payload?.petsPolicy).toBeUndefined();
    });

    it.each([
      ["erlaubt", "ALLOWED"],
      ["absprache", "BY_ARRANGEMENT"],
      ["nichtraucher", "NON_SMOKERS_PREFERRED"],
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

    it("omits smokingPolicy when no smoking option is selected", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, smoking: "" },
          "Titel",
        );
      });

      const payload = vi.mocked(createListingDraft).mock.calls[0]?.[0];
      expect(payload?.smokingPolicy).toBeUndefined();
    });

    it("sends suitableForPeopleCount from its own field", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, peopleCount: 3 },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ suitableForPeopleCount: 3 }),
      );
    });

    it("preserves a suitableForPeopleCount of 1", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, peopleCount: 1 },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ suitableForPeopleCount: 1 }),
      );
    });

    it("preserves a minimumHouseholdNetIncome of 0", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, minIncome: "0" },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({ minimumHouseholdNetIncome: 0 }),
      );
    });

    it("computes deposit from coldRent and depositMonths", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, price: "950", depositMonths: 3 },
          "Titel",
        );
      });

      expect(createListingDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          coldRent: 950,
          depositMonths: 3,
          deposit: 2850,
        }),
      );
    });

    it("omits both eligibility criteria when they are not configured", async () => {
      vi.mocked(createListingDraft).mockResolvedValue({ id: "d1" });
      const { result } = renderHook(() => useCreateListing());

      await act(async () => {
        await result.current.saveDraft(
          { ...DRAFT_SAVE_VALID, peopleCount: null, minIncome: "" },
          "Titel",
        );
      });

      const payload = vi.mocked(createListingDraft).mock.calls[0]?.[0];
      expect(payload).not.toHaveProperty("suitableForPeopleCount");
      expect(payload).not.toHaveProperty("minimumHouseholdNetIncome");
    });
  });
});
