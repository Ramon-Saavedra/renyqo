import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { INITIAL_DRAFT } from "./useListingDraft";
import type { ListingDraft, ListingPhoto } from "./useListingDraft";
import { useListingValidation } from "./useListingValidation";

const PHOTO: ListingPhoto = { id: "p1", src: "data:image/svg+xml;test" };

const VALID_DRAFT: ListingDraft = {
  ...INITIAL_DRAFT,
  address: "Musterstraße 1, 10115 Berlin",
  area: "65",
  rooms: "3",
  price: "1100",
  availableFrom: "2026-07-01",
  photos: [PHOTO],
  legalAccepted: true,
};

describe("useListingValidation", () => {
  describe("canPublish", () => {
    it("is false with INITIAL_DRAFT", () => {
      const { result } = renderHook(() => useListingValidation(INITIAL_DRAFT));

      expect(result.current.canPublish).toBe(false);
    });

    it("is true when all required fields are filled", () => {
      const { result } = renderHook(() => useListingValidation(VALID_DRAFT));

      expect(result.current.canPublish).toBe(true);
    });
  });

  describe("missing", () => {
    it("contains all 7 required labels with INITIAL_DRAFT", () => {
      const { result } = renderHook(() => useListingValidation(INITIAL_DRAFT));

      expect(result.current.missing).toContain("Adresse");
      expect(result.current.missing).toContain("Wohnfläche");
      expect(result.current.missing).toContain("Zimmer");
      expect(result.current.missing).toContain("Kaltmiete");
      expect(result.current.missing).toContain("Frei ab");
      expect(result.current.missing).toContain("Mindestens 1 Foto");
      expect(result.current.missing).toContain("Bestätigung");
      expect(result.current.missing).toHaveLength(7);
    });

    it("is empty when all required fields are filled", () => {
      const { result } = renderHook(() => useListingValidation(VALID_DRAFT));

      expect(result.current.missing).toHaveLength(0);
    });

    it("includes Adresse when address is empty", () => {
      const draft = { ...VALID_DRAFT, address: "" };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Adresse");
    });

    it("includes Adresse when address is whitespace-only", () => {
      const draft = { ...VALID_DRAFT, address: "   " };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Adresse");
    });

    it("includes Wohnfläche when area is empty", () => {
      const draft = { ...VALID_DRAFT, area: "" };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Wohnfläche");
    });

    it("includes Zimmer when rooms is empty", () => {
      const draft = { ...VALID_DRAFT, rooms: "" };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Zimmer");
    });

    it("includes Kaltmiete when price is empty", () => {
      const draft = { ...VALID_DRAFT, price: "" };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Kaltmiete");
    });

    it("includes Frei ab when availableFrom is empty", () => {
      const draft = { ...VALID_DRAFT, availableFrom: "" };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Frei ab");
    });

    it("includes photo label when photos array is empty", () => {
      const draft = { ...VALID_DRAFT, photos: [] };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Mindestens 1 Foto");
    });

    it("does not include photo label when at least one photo exists", () => {
      const { result } = renderHook(() => useListingValidation(VALID_DRAFT));

      expect(result.current.missing).not.toContain("Mindestens 1 Foto");
    });

    it("includes Bestätigung when legalAccepted is false", () => {
      const draft = { ...VALID_DRAFT, legalAccepted: false };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.missing).toContain("Bestätigung");
    });
  });

  describe("completedSteps", () => {
    it("is empty with INITIAL_DRAFT", () => {
      const { result } = renderHook(() => useListingValidation(INITIAL_DRAFT));

      expect(result.current.completedSteps).toHaveLength(0);
    });

    it("includes sec-01 when address, area, rooms, price, availableFrom are all set", () => {
      const draft = {
        ...INITIAL_DRAFT,
        address: "Hauptstraße 1",
        area: "60",
        rooms: "2" as const,
        price: "900",
        availableFrom: "2026-08-01",
      };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).toContain("sec-01");
    });

    it("does not include sec-01 when one of the five fields is missing", () => {
      const draft = {
        ...INITIAL_DRAFT,
        area: "60",
        rooms: "2" as const,
        price: "900",
        availableFrom: "2026-08-01",
      };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).not.toContain("sec-01");
    });

    it("includes sec-01 for a whitespace-only address (raw address is truthy)", () => {
      const draft = {
        ...INITIAL_DRAFT,
        address: "   ",
        area: "60",
        rooms: "2" as const,
        price: "900",
        availableFrom: "2026-08-01",
      };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).toContain("sec-01");
      expect(result.current.missing).toContain("Adresse");
    });

    it("includes sec-02 when adults is 1 or more", () => {
      const draft = { ...INITIAL_DRAFT, adults: 1 };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).toContain("sec-02");
    });

    it("does not include sec-02 when adults is 0", () => {
      const draft = { ...INITIAL_DRAFT, adults: 0 };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).not.toContain("sec-02");
    });

    it("does not include sec-02 when adults is null", () => {
      const { result } = renderHook(() => useListingValidation(INITIAL_DRAFT));

      expect(result.current.completedSteps).not.toContain("sec-02");
    });

    it("includes sec-03 when legalAccepted is true", () => {
      const draft = { ...INITIAL_DRAFT, legalAccepted: true };
      const { result } = renderHook(() => useListingValidation(draft));

      expect(result.current.completedSteps).toContain("sec-03");
    });

    it("does not include sec-03 when legalAccepted is false", () => {
      const { result } = renderHook(() => useListingValidation(INITIAL_DRAFT));

      expect(result.current.completedSteps).not.toContain("sec-03");
    });
  });
});
