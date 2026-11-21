import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api/client";
import { discoverWorkspaces, readCurrentWorkspace } from "./api";
import { workspaceRequestOptions, mergeRequestOptions } from "./request-scope";
import {
  current,
  discovery,
  workspaceA,
  workspaceB,
} from "./testing/workspace-fixture";
vi.mock("@/lib/api/csrf", () => ({
  getCsrfToken: vi.fn().mockResolvedValue("token"),
  clearCsrfToken: vi.fn(),
  csrfTokenPath: "/api/v1/auth/csrf",
}));
afterEach(() => vi.unstubAllGlobals());
describe("explicit provider request binding", () => {
  it("keeps A requests bound to A after B is selected", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }))),
      );
    vi.stubGlobal("fetch", fetchMock);
    const a = workspaceRequestOptions(workspaceA, new AbortController().signal);
    const b = workspaceRequestOptions(workspaceB, new AbortController().signal);
    await apiGet("/api/v1/provider/listings", a);
    await apiGet("/api/v1/provider/listings", b);
    await apiGet("/api/v1/provider/listings", a);
    expect(
      fetchMock.mock.calls.map((call) =>
        new Headers(call[1].headers).get("x-workspace-id"),
      ),
    ).toEqual([workspaceA, workspaceB, workspaceA]);
  });
  it("does not send workspace headers to discovery, public, applicant or auth", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.endsWith("/provider/workspaces") ? [discovery()] : {},
            ),
          ),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await discoverWorkspaces(new AbortController().signal);
    await apiGet("/api/v1/listings");
    await apiGet("/api/v1/applicant/applications");
    await apiPost("/api/v1/auth/login", {});
    expect(
      fetchMock.mock.calls.every(
        (call) => !new Headers(call[1].headers).has("x-workspace-id"),
      ),
    ).toBe(true);
  });
  it("reads current with the captured workspace and rejects malformed projections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(current()))),
    );
    await expect(
      readCurrentWorkspace(
        workspaceRequestOptions(workspaceA, new AbortController().signal),
      ),
    ).resolves.toEqual(current());
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...current(), actions: {} })),
        ),
    );
    await expect(
      readCurrentWorkspace(
        workspaceRequestOptions(workspaceA, new AbortController().signal),
      ),
    ).rejects.toThrow();
  });
  it("prevents request options overriding the captured workspace and combines cancellation", () => {
    const scope = new AbortController(),
      local = new AbortController();
    const merged = mergeRequestOptions(
      workspaceRequestOptions(workspaceA, scope.signal),
      { signal: local.signal, headers: { "x-workspace-id": workspaceB } },
    );
    expect(new Headers(merged.headers).get("x-workspace-id")).toBe(workspaceA);
    scope.abort();
    expect(merged.signal?.aborted).toBe(true);
  });
});
