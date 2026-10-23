import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAuthRequiredError, recoverRealtimeSession } from "./session-guard";
import { getCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { clearGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { getRealtimeEpoch, resumeRealtimeConnection } from "./client";

vi.mock("@/lib/api/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/api/use-current-user", () => ({
  invalidateCurrentUser: vi.fn(),
}));
vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  clearGlobalAttention: vi.fn(),
}));
vi.mock("./client", () => ({
  getRealtimeEpoch: vi.fn(),
  resumeRealtimeConnection: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it("ignores an old session's 401 and checks a new session independently", async () => {
  let rejectOld!: (error: Error) => void;
  const oldResponse = new Promise<never>((_, reject) => {
    rejectOld = reject;
  });
  vi.mocked(getRealtimeEpoch).mockReturnValue(1);
  vi.mocked(getCurrentUser)
    .mockReturnValueOnce(oldResponse)
    .mockResolvedValueOnce({
      id: "new-user",
      name: "New",
      email: "new@example.com",
      role: "applicant",
      providerType: null,
      companyName: null,
    });
  const oldRecovery = recoverRealtimeSession();
  vi.mocked(getRealtimeEpoch).mockReturnValue(2);
  const newRecovery = recoverRealtimeSession();
  expect(getCurrentUser).toHaveBeenCalledTimes(2);
  await newRecovery;
  expect(resumeRealtimeConnection).toHaveBeenCalledTimes(1);
  rejectOld(new ApiError(401, "Unauthorized", "http"));
  await oldRecovery;
  expect(clearGlobalAttention).not.toHaveBeenCalled();
  expect(invalidateCurrentUser).not.toHaveBeenCalled();
});

describe("isAuthRequiredError", () => {
  it("matches only the stable auth code", () => {
    expect(isAuthRequiredError({ data: { code: "AUTH_REQUIRED" } })).toBe(true);
    expect(isAuthRequiredError({ data: { code: "OTHER" } })).toBe(false);
    expect(isAuthRequiredError({ message: "AUTH_REQUIRED" })).toBe(false);
    expect(isAuthRequiredError({ data: "AUTH_REQUIRED" })).toBe(false);
    expect(isAuthRequiredError(null)).toBe(false);
  });
});
