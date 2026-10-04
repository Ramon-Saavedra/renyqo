import { describe, expect, it } from "vitest";
import { availableDocumentTypes, isActiveCustomLabel } from "./document-labels";

const current = (type: string, customLabel: string | null = null) => ({
  type,
  customLabel,
});

describe("available document request types", () => {
  it("excludes an active predefined type and keeps the others", () => {
    expect(availableDocumentTypes([current("SCHUFA")])).toEqual([
      "INCOME_PROOF",
      "IDENTITY_DOCUMENT",
      "LIABILITY_INSURANCE",
      "OTHER",
    ]);
    expect(availableDocumentTypes([current("INCOME_PROOF")])).toEqual([
      "SCHUFA",
      "IDENTITY_DOCUMENT",
      "LIABILITY_INSURANCE",
      "OTHER",
    ]);
  });

  it("excludes every active predefined type once", () => {
    expect(
      availableDocumentTypes([
        current("SCHUFA"),
        current("INCOME_PROOF"),
        current("SCHUFA"),
      ]),
    ).toEqual(["IDENTITY_DOCUMENT", "LIABILITY_INSURANCE", "OTHER"]);
  });

  it("offers a predefined type again when it is no longer current", () => {
    expect(availableDocumentTypes([])).toContain("SCHUFA");
    expect(availableDocumentTypes([current("INCOME_PROOF")])).toContain(
      "SCHUFA",
    );
  });

  it("keeps Sonstiges available when another custom label is already requested", () => {
    const requests = [current("OTHER", "Arbeitsvertrag")];
    expect(availableDocumentTypes(requests)).toContain("OTHER");
    expect(isActiveCustomLabel(requests, "  ARBEITSVERTRAG ")).toBe(true);
    expect(
      isActiveCustomLabel(requests, "Mietschuldenfreiheitsbescheinigung"),
    ).toBe(false);
  });
});
