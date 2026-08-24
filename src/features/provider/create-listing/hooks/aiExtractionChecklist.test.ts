import { describe, expect, it, vi } from "vitest";

import {
  buildExtractionChecklistState,
  buildPostApplyChecklistState,
  countRecognizedFields,
} from "./aiExtractionChecklist";
import type { ExtractionFieldDescriptor } from "./listingExtractionMapping";

function descriptor(
  key: string,
  label: string,
): ExtractionFieldDescriptor {
  return { key, label, apply: vi.fn() };
}

describe("buildExtractionChecklistState", () => {
  it("uses the same Noch fehlt labels as the form checklist", () => {
    const state = buildExtractionChecklistState(
      {
        values: { city: "Berlin", rooms: 3 },
        requiredMissingFields: ["bedrooms", "availableFrom"],
        recommendedMissingFields: [],
        inconsistencies: [],
        warnings: [],
      },
      [
        descriptor("city", "Stadt"),
        descriptor("rooms", "Zimmer"),
        descriptor("suitableForPeopleCount", "Passend für insgesamt"),
      ],
    );

    expect(state.required.missing).toEqual([
      "PLZ",
      "Straße",
      "Objekttyp",
      "Wohnfläche",
      "Schlafzimmer",
      "Kaltmiete",
      "Frei ab",
    ]);
    expect(state.recommended.missing).toEqual([
      "Mindesteinkommen netto",
      "SCHUFA-Auskunft",
      "Einkommensnachweis",
      "Haustiere",
      "Rauchen",
    ]);
    expect(state.optional.missing).toEqual([]);
    expect(state.required.items.some((item) => item.label === "Stadt")).toBe(
      true,
    );
  });

  it("does not mark required complete when nothing was recognized", () => {
    const state = buildExtractionChecklistState(
      {
        values: { city: "Berlin" },
        requiredMissingFields: [],
        recommendedMissingFields: [],
        inconsistencies: [],
        warnings: [],
      },
      [],
    );

    expect(state.required.complete).toBe(false);
    expect(state.required.missing).toHaveLength(9);
  });

  it("does not mark recommended complete when nothing was recognized", () => {
    const state = buildExtractionChecklistState(
      {
        values: { city: "Berlin" },
        requiredMissingFields: [],
        recommendedMissingFields: [],
        inconsistencies: [],
        warnings: [],
      },
      [],
    );

    expect(state.recommended.complete).toBe(false);
    expect(state.recommended.missing).toHaveLength(6);
  });

  it("maps optional Nebenkosten gaps from recommended missing fields", () => {
    const state = buildExtractionChecklistState(
      {
        values: { city: "Berlin", coldRent: 1200 },
        requiredMissingFields: [],
        recommendedMissingFields: ["additionalCosts"],
        inconsistencies: [],
        warnings: [],
      },
      [],
    );

    expect(state.optional.missing).toEqual(["Nebenkosten"]);
    expect(state.optional.items).toEqual([
      { label: "Nebenkosten", targetId: "additional-costs" },
      { label: "Kaution", targetId: "deposit-months" },
    ]);
  });

  it("maps optional Kaution gaps from recommended missing fields", () => {
    const state = buildExtractionChecklistState(
      {
        values: { city: "Berlin", coldRent: 1200 },
        requiredMissingFields: [],
        recommendedMissingFields: ["depositMonths"],
        inconsistencies: [],
        warnings: [],
      },
      [],
    );

    expect(state.optional.missing).toEqual(["Kaution"]);
  });
});

describe("countRecognizedFields", () => {
  it("counts every recognized descriptor", () => {
    expect(
      countRecognizedFields([
        descriptor("city", "Stadt"),
        descriptor("coldRent", "Kaltmiete"),
      ]),
    ).toBe(2);
  });
});

describe("buildPostApplyChecklistState", () => {
  it("reminds the provider about photos and description after apply", () => {
    const state = buildPostApplyChecklistState(false, false);

    expect(state.complete).toBe(false);
    expect(state.missing).toEqual(["Fotos", "Kurzbeschreibung"]);
  });

  it("is complete when photos and description are already present", () => {
    const state = buildPostApplyChecklistState(true, true);

    expect(state.complete).toBe(true);
    expect(state.missing).toEqual([]);
  });
});
