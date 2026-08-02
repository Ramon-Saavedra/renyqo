import { describe, expect, it } from "vitest";
import { createOnceCache } from "./once-cache";

describe("createOnceCache", () => {
  it("does not restore an invalidated in-flight value", async () => {
    let resolveLoad: (value: string) => void = () => undefined;
    const cache = createOnceCache(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const request = cache.load();
    cache.invalidate();
    resolveLoad("stale");
    await request;

    const nextRequest = cache.load();
    resolveLoad("fresh");

    await expect(nextRequest).resolves.toBe("fresh");
    await expect(cache.load()).resolves.toBe("fresh");
  });

  it("does not clear a newer request when an older request settles", async () => {
    const resolvers: Array<(value: string) => void> = [];
    const cache = createOnceCache(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const firstRequest = cache.load();
    cache.invalidate();
    const secondRequest = cache.load();

    resolvers[0]?.("first");
    await firstRequest;

    expect(cache.load()).toBe(secondRequest);

    resolvers[1]?.("second");
    await expect(secondRequest).resolves.toBe("second");
  });
});
