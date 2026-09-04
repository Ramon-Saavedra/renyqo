import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPatchVoid } from "@/lib/api/client";
import { rejectProviderApplication } from "./provider-application-rejection";

vi.mock("@/lib/api/client", () => ({
  apiPatchVoid: vi.fn(),
}));

describe("rejectProviderApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects the application through the provider endpoint", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue();

    await rejectProviderApplication("application/1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/applications/application%2F1/reject",
    );
  });
});
