import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as ApiClient from "@/lib/api/client";
import { apiPatchVoid } from "@/lib/api/client";
import { cancelDocumentRequest, documentRequestPayload } from "./documents";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return {
    ...actual,
    apiPatchVoid: vi.fn(),
  };
});

describe("documentRequestPayload", () => {
  it("sends every supported type and a custom label only for OTHER", () => {
    expect(
      documentRequestPayload([
        { type: "SCHUFA" },
        { type: "INCOME_PROOF" },
        { type: "IDENTITY_DOCUMENT" },
        { type: "LIABILITY_INSURANCE" },
        { type: "OTHER", customLabel: "  Mietvertrag   alt " },
      ]),
    ).toEqual({
      requests: [
        { type: "SCHUFA" },
        { type: "INCOME_PROOF" },
        { type: "IDENTITY_DOCUMENT" },
        { type: "LIABILITY_INSURANCE" },
        { type: "OTHER", customLabel: "Mietvertrag alt" },
      ],
    });
  });

  it("rejects an OTHER request without a usable label", () => {
    expect(() =>
      documentRequestPayload([{ type: "OTHER", customLabel: "<script>" }]),
    ).toThrow("Invalid applicant workspace response");
  });
});

describe("cancelDocumentRequest", () => {
  beforeEach(() => {
    vi.mocked(apiPatchVoid).mockReset();
  });

  it("patches the provider cancel route without a body", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);
    await cancelDocumentRequest("application-1", "request-1");
    expect(apiPatchVoid).toHaveBeenCalledTimes(1);
    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/applications/application-1/document-requests/request-1/cancel",
    );
    const [path] = vi.mocked(apiPatchVoid).mock.calls[0] ?? [];
    expect(String(path)).not.toContain("/applicant/");
  });
});
