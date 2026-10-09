import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGetBlobResponse } from "./client";

vi.mock("./csrf", () => ({
  csrfTokenPath: "/api/v1/auth/csrf-token",
  clearCsrfToken: vi.fn(),
  getCsrfToken: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

describe("blob response metadata", () => {
  it("returns the response MIME and exposed content-disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("%PDF", {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="document.pdf"',
          },
        }),
      ),
    );
    const result = await apiGetBlobResponse("/test-document");
    expect(result.blob.type).toBe("application/pdf");
    expect(result.contentDisposition).toBe(
      'attachment; filename="document.pdf"',
    );
  });

  it("represents unavailable filename metadata as null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("%PDF", {
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    );
    const result = await apiGetBlobResponse("/test-document");
    expect(result.contentDisposition).toBeNull();
  });
});
