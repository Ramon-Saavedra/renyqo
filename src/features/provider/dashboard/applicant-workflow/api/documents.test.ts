import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as ApiClient from "@/lib/api/client";
import { apiGetBlob, apiPatchVoid } from "@/lib/api/client";
import {
  cancelDocumentRequest,
  documentRequestPayload,
  openDocumentContent,
} from "./documents";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return {
    ...actual,
    apiPatchVoid: vi.fn(),
    apiGetBlob: vi.fn(),
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

describe("openDocumentContent", () => {
  const open = vi.fn();

  beforeEach(() => {
    vi.mocked(apiGetBlob).mockReset();
    open.mockReset();
    vi.stubGlobal("open", open);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the tab before the download finishes", async () => {
    const tab = {
      opener: window,
      close: vi.fn(),
      location: { replace: vi.fn() },
    };
    open.mockReturnValue(tab);
    let resolveBlob: ((blob: Blob) => void) | undefined;
    vi.mocked(apiGetBlob).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBlob = resolve;
        }),
    );

    const pending = openDocumentContent("application-1", "document-1");

    expect(open).toHaveBeenCalledWith("about:blank", "_blank");
    expect(apiGetBlob).toHaveBeenCalledWith(
      "/api/v1/provider/applications/application-1/documents/document-1/content",
    );
    expect(tab.location.replace).not.toHaveBeenCalled();
    resolveBlob?.(new Blob(["file"]));
    await pending;
    expect(tab.location.replace).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();
    expect(tab.close).not.toHaveBeenCalled();
  });

  it("closes the tab when the download fails", async () => {
    const tab = {
      opener: window,
      close: vi.fn(),
      location: { replace: vi.fn() },
    };
    open.mockReturnValue(tab);
    vi.mocked(apiGetBlob).mockRejectedValue(new Error("failed"));

    await expect(
      openDocumentContent("application-1", "document-1"),
    ).rejects.toThrow("failed");
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
  });
});
