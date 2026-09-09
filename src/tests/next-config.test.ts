import { describe, expect, it } from "vitest";
import nextConfig, { REFERRER_POLICY } from "../../next.config";

describe("next.config security headers", () => {
  it("sets Referrer-Policy on all paths", async () => {
    expect(REFERRER_POLICY).toBe("strict-origin");
    expect(nextConfig.headers).toEqual(expect.any(Function));

    const headers = await nextConfig.headers?.();

    expect(headers).toEqual([
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: REFERRER_POLICY,
          },
        ],
      },
    ]);
  });
});
