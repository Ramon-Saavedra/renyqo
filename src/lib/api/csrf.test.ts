import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearCsrfToken, getCsrfToken } from "./csrf";

describe("csrf token client", () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.restoreAllMocks();
  });

  it("fetches and caches the token in memory", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: "token-1" }), { status: 200 }),
      );

    await expect(getCsrfToken()).resolves.toBe("token-1");
    await expect(getCsrfToken()).resolves.toBe("token-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/csrf-token"),
      { credentials: "include" },
    );
  });

  it("deduplicates concurrent requests", async () => {
    let resolve: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((res) => {
          resolve = res;
        }),
    );

    const first = getCsrfToken();
    const second = getCsrfToken();
    resolve?.(
      new Response(JSON.stringify({ csrfToken: "token-2" }), { status: 200 }),
    );

    await expect(Promise.all([first, second])).resolves.toEqual([
      "token-2",
      "token-2",
    ]);
  });
});
