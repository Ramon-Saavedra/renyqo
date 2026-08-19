import { describe, expect, it, vi } from "vitest";

import type { ListingExtractionValues } from "@/lib/api/listing-assistance";
import {
  applyExtractionResult,
  buildExtractionFieldDescriptors,
  findMissingRecommendedLabels,
  mapInconsistencyLabel,
  mapMissingFieldLabel,
} from "./listingExtractionMapping";

const FULL_VALUES: ListingExtractionValues = {
  city: "Berlin",
  zip: "10115",
  street: "Musterstraße 1",
  showExactAddress: false,
  objectType: "APARTMENT",
  livingArea: 65.4,
  rooms: 3.2,
  bedrooms: 1,
  coldRent: 1099.6,
  additionalCosts: 200,
  depositMonths: 5,
  availableFrom: "2026-07-01T00:00:00.000Z",
  title: "Helle 3-Zimmer-Wohnung",
  shortDescription: "Schöne Wohnung mit Balkon.",
  minimumHouseholdNetIncome: 3000,
  schufaRequired: true,
  incomeProofRequired: false,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
};

describe("buildExtractionFieldDescriptors", () => {
  it("returns no descriptors for an empty extraction result", () => {
    expect(buildExtractionFieldDescriptors({})).toEqual([]);
  });

  it("builds a descriptor per present field, with formatted values", () => {
    const descriptors = buildExtractionFieldDescriptors(FULL_VALUES);
    const byKey = new Map(descriptors.map((d) => [d.key, d]));

    expect(byKey.get("objectType")?.label).toBe("Objekttyp");
    expect(byKey.get("livingArea")?.label).toBe("Wohnfläche");
    expect(byKey.get("rooms")?.label).toBe("Zimmer");
    expect(byKey.get("coldRent")?.label).toBe("Kaltmiete");
    expect(byKey.get("availableFrom")?.label).toBe("Verfügbar ab");
    expect(byKey.has("title")).toBe(true);
    expect(byKey.has("shortDescription")).toBe(true);
  });

  it("preserves one decimal place for living area", () => {
    const descriptors = buildExtractionFieldDescriptors({ livingArea: 65.4 });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("area", "65.4");
  });

  it("clamps depositMonths to the 1-3 range", () => {
    const descriptors = buildExtractionFieldDescriptors({ depositMonths: 5 });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("depositMonths", 3);
  });

  it("rounds rooms to the nearest half step", () => {
    const descriptors = buildExtractionFieldDescriptors({ rooms: 3.2 });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("rooms", "3");
  });

  it("truncates the availableFrom ISO string to a date input value", () => {
    const descriptors = buildExtractionFieldDescriptors({
      availableFrom: "2026-07-01T00:00:00.000Z",
    });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("availableFrom", "2026-07-01");
  });

  it("ignores null bedrooms/peopleCount instead of applying them", () => {
    const descriptors = buildExtractionFieldDescriptors({
      bedrooms: null,
      suitableForPeopleCount: null,
    });
    expect(descriptors).toEqual([]);
  });

  it.each([
    ["APARTMENT", "wohnung"],
    ["HOUSE", "haus"],
    ["ROOM", "zimmer"],
  ] as const)("maps backend objectType %s to %s", (backend, frontend) => {
    const descriptors = buildExtractionFieldDescriptors({
      objectType: backend,
    });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("objectType", frontend);
  });

  it.each([
    ["ALLOWED", "erlaubt"],
    ["BY_ARRANGEMENT", "absprache"],
    ["PREFER_NOT", "keine"],
  ] as const)("maps backend petsPolicy %s to %s", (backend, frontend) => {
    const descriptors = buildExtractionFieldDescriptors({
      petsPolicy: backend,
    });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("pets", frontend);
  });

  it.each([
    ["ALLOWED", "erlaubt"],
    ["BY_ARRANGEMENT", "absprache"],
    ["NON_SMOKERS_PREFERRED", "nichtraucher"],
  ] as const)("maps backend smokingPolicy %s to %s", (backend, frontend) => {
    const descriptors = buildExtractionFieldDescriptors({
      smokingPolicy: backend,
    });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("smoking", frontend);
  });

  it.each([
    [true, "erforderlich"],
    [false, "nein"],
  ] as const)("maps schufaRequired %s to %s", (backend, frontend) => {
    const descriptors = buildExtractionFieldDescriptors({
      schufaRequired: backend,
    });
    const setField = vi.fn();
    descriptors[0]?.apply(setField);
    expect(setField).toHaveBeenCalledWith("schufa", frontend);
  });
});

describe("applyExtractionResult", () => {
  it("applies every descriptor and inverts showExactAddress into hideAddress", () => {
    const setField = vi.fn();
    const descriptors = buildExtractionFieldDescriptors(FULL_VALUES);

    applyExtractionResult(FULL_VALUES, descriptors, setField);

    expect(setField).toHaveBeenCalledWith("hideAddress", true);
    expect(setField).toHaveBeenCalledWith("city", "Berlin");
    expect(setField).toHaveBeenCalledWith(
      "titleOverride",
      "Helle 3-Zimmer-Wohnung",
    );
    expect(setField.mock.calls.length).toBe(descriptors.length + 1);
  });

  it("does not touch hideAddress when showExactAddress is absent", () => {
    const setField = vi.fn();
    applyExtractionResult({ city: "Berlin" }, [], setField);
    expect(setField).not.toHaveBeenCalledWith("hideAddress", expect.anything());
  });
});

describe("mapMissingFieldLabel", () => {
  it("maps known backend field names to German labels", () => {
    expect(mapMissingFieldLabel("coldRent")).toBe("Kaltmiete");
    expect(mapMissingFieldLabel("livingArea")).toBe("Wohnfläche");
    expect(mapMissingFieldLabel("availableFrom")).toBe("Verfügbar ab");
  });

  it("uses a safe label when the backend field is unknown", () => {
    expect(mapMissingFieldLabel("somethingUnmapped")).toBe("Weitere Angabe");
  });
});

describe("mapInconsistencyLabel", () => {
  it("maps a deposit inconsistency to the deposit label", () => {
    expect(
      mapInconsistencyLabel({
        field: "deposit",
        message: "deposit must equal coldRent multiplied by depositMonths",
      }),
    ).toBe("Kaution");
  });

  it("maps the cross-field 'listing' issue to the rooms label", () => {
    expect(
      mapInconsistencyLabel({
        field: "listing",
        message: "bedrooms must not be greater than rooms",
      }),
    ).toBe("Zimmer");
  });
});

describe("findMissingRecommendedLabels", () => {
  it("returns all recommended labels when nothing was recognized", () => {
    expect(findMissingRecommendedLabels([])).toEqual([
      "Haushaltsnettoeinkommen",
      "SCHUFA-Anforderung",
      "Einkommensnachweis",
      "Personenzahl",
      "Haustiere",
      "Rauchen",
    ]);
  });

  it("excludes recommended fields already present in the descriptors", () => {
    const descriptors = buildExtractionFieldDescriptors({
      schufaRequired: true,
      petsPolicy: "ALLOWED",
    });
    expect(findMissingRecommendedLabels(descriptors)).toEqual([
      "Haushaltsnettoeinkommen",
      "Einkommensnachweis",
      "Personenzahl",
      "Rauchen",
    ]);
  });
});
