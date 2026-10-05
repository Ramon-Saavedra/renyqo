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
  const createObjectURL = vi.fn<(blob: Blob) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();

  beforeEach(() => {
    vi.mocked(apiGetBlob).mockReset();
    open.mockReset();
    vi.stubGlobal("open", open);
    createObjectURL.mockReset().mockReturnValue("blob:download");
    revokeObjectURL.mockReset();
    vi.stubGlobal(
      "URL",
      Object.assign(class extends URL {}, {
        createObjectURL,
        revokeObjectURL,
      }),
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["text/html", "image/svg+xml", "application/pdf"])(
    "downloads %s content without navigating or opening a tab",
    async (mimeType) => {
      let download:
        | { href: string; filename: string; target: string; connected: boolean }
        | undefined;
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          download = {
            href: this.href,
            filename: this.download,
            target: this.target,
            connected: this.isConnected,
          };
        },
      );
      let resolveBlob: ((blob: Blob) => void) | undefined;
      vi.mocked(apiGetBlob).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveBlob = resolve;
          }),
      );

      const pending = openDocumentContent("application-1", "document-1");

      expect(open).not.toHaveBeenCalled();
      expect(apiGetBlob).toHaveBeenCalledWith(
        "/api/v1/provider/applications/application-1/documents/document-1/content",
      );
      expect(download).toBeUndefined();
      resolveBlob?.(
        new Blob(["<script>document.title = 'untrusted'</script>"], {
          type: mimeType,
        }),
      );
      await pending;
      expect(open).not.toHaveBeenCalled();
      expect(download).toEqual({
        href: "blob:download",
        filename: "Unterlage",
        target: "",
        connected: true,
      });
      const [downloadBlob] = createObjectURL.mock.calls[0] ?? [];
      expect(downloadBlob).toBeInstanceOf(Blob);
      expect(downloadBlob?.type).toBe("application/octet-stream");
      expect(document.querySelector('a[download="Unterlage"]')).toBeNull();
      expect(revokeObjectURL).not.toHaveBeenCalled();
      await vi.runAllTimersAsync();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
    },
  );

  it("propagates download failures without opening a tab or creating a URL", async () => {
    vi.mocked(apiGetBlob).mockRejectedValue(new Error("failed"));

    await expect(
      openDocumentContent("application-1", "document-1"),
    ).rejects.toThrow("failed");
    expect(open).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
