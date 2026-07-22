import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { neighborhoodFrom, useAutoTitle } from "./useAutoTitle";

describe("neighborhoodFrom", () => {
  it("returns empty string for an empty address", () => {
    expect(neighborhoodFrom("")).toBe("");
  });

  it("returns empty string when address has a single part", () => {
    expect(neighborhoodFrom("Berlin")).toBe("");
  });

  it("returns the last part when address has two comma-separated parts", () => {
    expect(neighborhoodFrom("Hauptstraße 1, Berlin")).toBe("Berlin");
  });

  it("strips a 5-digit postal prefix from the last part", () => {
    expect(neighborhoodFrom("Hauptstraße 1, 10115 Berlin")).toBe("Berlin");
  });

  it("strips a 4-digit postal prefix from the last part", () => {
    expect(neighborhoodFrom("Hauptstraße 1, 1020 Wien")).toBe("Wien");
  });

  it("returns the last part of a three-segment address", () => {
    expect(neighborhoodFrom("Straße 1, Berlin, Mitte")).toBe("Mitte");
  });

  it("trims surrounding whitespace from the result", () => {
    expect(neighborhoodFrom("Straße 1,  Berlin")).toBe("Berlin");
  });
});

describe("useAutoTitle", () => {
  describe("typeLabel", () => {
    it("returns Wohnung for objectType wohnung", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "wohnung", rooms: "", city: "" }),
      );

      expect(result.current.typeLabel).toBe("Wohnung");
    });

    it("returns Haus for objectType haus", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "haus", rooms: "", city: "" }),
      );

      expect(result.current.typeLabel).toBe("Haus");
    });

    it("returns Zimmer for objectType zimmer", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "zimmer", rooms: "", city: "" }),
      );

      expect(result.current.typeLabel).toBe("Zimmer");
    });
  });

  describe("autoTitle", () => {
    it("equals the typeLabel when rooms and address are both empty", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "wohnung", rooms: "", city: "" }),
      );

      expect(result.current.autoTitle).toBe("Wohnung");
    });

    it("prepends the room count when rooms is set and address is empty", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "wohnung", rooms: "3", city: "" }),
      );

      expect(result.current.autoTitle).toBe("3-Zimmer-Wohnung");
    });

    it("appends neighborhood when address has a neighborhood and rooms is empty", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "wohnung",
          rooms: "",
          city: "Berlin",
        }),
      );

      expect(result.current.autoTitle).toBe("Wohnung in Berlin");
    });

    it("includes both rooms and neighborhood when both are present", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "wohnung",
          rooms: "2",
          city: "Mitte",
        }),
      );

      expect(result.current.autoTitle).toBe("2-Zimmer-Wohnung in Mitte");
    });

    it("works correctly with haus type and a neighborhood", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "haus",
          rooms: "5",
          city: "Hamburg",
        }),
      );

      expect(result.current.autoTitle).toBe("5-Zimmer-Haus in Hamburg");
    });

    it("omits the room count for zimmer so the label is not duplicated", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "zimmer",
          rooms: "2",
          city: "Nordhorn",
        }),
      );

      expect(result.current.autoTitle).toBe("Zimmer in Nordhorn");
    });

    it("omits the room count for zimmer even when rooms is 1", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "zimmer",
          rooms: "1",
          city: "Nordhorn",
        }),
      );

      expect(result.current.autoTitle).toBe("Zimmer in Nordhorn");
    });

    it("uses a German decimal comma for half rooms", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "wohnung",
          rooms: "1.5",
          city: "Berlin",
        }),
      );

      expect(result.current.autoTitle).toBe("1,5-Zimmer-Wohnung in Berlin");
    });

    it("generates title for a high room count", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "haus",
          rooms: "25",
          city: "Hamburg",
        }),
      );

      expect(result.current.autoTitle).toBe("25-Zimmer-Haus in Hamburg");
    });

    it("returns only typeLabel when city is empty", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "wohnung",
          rooms: "",
          city: "",
        }),
      );

      expect(result.current.autoTitle).toBe("Wohnung");
    });
  });

  describe("isAutoPlaceholder", () => {
    it("is true when autoTitle equals the typeLabel", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "wohnung", rooms: "", city: "" }),
      );

      expect(result.current.isAutoPlaceholder).toBe(true);
    });

    it("is false when rooms are set", () => {
      const { result } = renderHook(() =>
        useAutoTitle({ objectType: "wohnung", rooms: "3", city: "" }),
      );

      expect(result.current.isAutoPlaceholder).toBe(false);
    });

    it("is false when neighborhood is extracted from address", () => {
      const { result } = renderHook(() =>
        useAutoTitle({
          objectType: "wohnung",
          rooms: "",
          city: "Berlin",
        }),
      );

      expect(result.current.isAutoPlaceholder).toBe(false);
    });
  });
});
