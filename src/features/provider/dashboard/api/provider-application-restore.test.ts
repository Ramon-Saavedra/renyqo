import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPatchVoid } from "@/lib/api/client";
import { restoreProviderApplication } from "./provider-application-restore";

vi.mock("@/lib/api/client", () => ({
  apiPatchVoid: vi.fn(),
}));

describe("restoreProviderApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores the application through the provider endpoint", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue();

    await restoreProviderApplication("application/1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/applications/application%2F1/restore",
    );
  });
});
