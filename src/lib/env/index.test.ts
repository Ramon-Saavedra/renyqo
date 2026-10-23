import { describe, expect, it, vi } from "vitest";
import { isRealtimeEnabled } from "./index";

describe("isRealtimeEnabled", () => {
  it("defaults off unless the public flag is exactly true", () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", undefined);
    expect(isRealtimeEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "false");
    expect(isRealtimeEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "1");
    expect(isRealtimeEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_REALTIME_ENABLED", "true");
    expect(isRealtimeEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });
});
