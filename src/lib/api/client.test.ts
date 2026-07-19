import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  apiGet,
  apiPatch,
  apiPatchVoid,
  apiPost,
  apiPostJsonVoid,
  apiPostFormData,
  apiPostVoid,
} from "./client";

function makeMockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function makeTextResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
  } as Response;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ApiError", () => {
  it("is an instance of Error", () => {
    expect(new ApiError(400, "Bad Request")).toBeInstanceOf(Error);
  });

  it("is an instance of ApiError", () => {
    expect(new ApiError(401, "Unauthorized")).toBeInstanceOf(ApiError);
  });

  it("exposes the status code on the status property", () => {
    expect(new ApiError(403, "Forbidden").status).toBe(403);
  });

  it("exposes the message via the Error message property", () => {
    expect(new ApiError(422, "Unprocessable").message).toBe("Unprocessable");
  });

  it("has ApiError as its name", () => {
    expect(new ApiError(500, "Error").name).toBe("ApiError");
  });
});

describe("apiPost", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws ApiError with status 0 on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiPost("/test", {})).rejects.toMatchObject({ status: 0 });
  });

  it("throws ApiError with the response status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(401, { message: "Unauthorized" })),
    );

    await expect(apiPost("/test", {})).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });

  it("uses the first element when the backend error message is an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          makeMockResponse(400, { message: ["first error", "second error"] }),
        ),
    );

    await expect(apiPost("/test", {})).rejects.toMatchObject({
      message: "first error",
    });
  });

  it("returns the parsed JSON body on a 2xx response", async () => {
    const data = { id: "1", name: "Test" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeMockResponse(200, data)),
    );

    await expect(apiPost("/test", data)).resolves.toEqual(data);
  });

  it("calls fetch with POST method, credentials include and JSON content-type", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
    vi.stubGlobal("fetch", mockFetch);

    await apiPost("/test", { key: "value" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value" }),
      }),
    );
  });

  it("the thrown error passes instanceof ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(500, { message: "Server error" })),
    );

    let caught: unknown;
    try {
      await apiPost("/test", {});
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
  });

  it("maps an aborted request caused by the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );

    const request = apiPost("/test", {});
    const expectation = expect(request).rejects.toMatchObject({
      kind: "timeout",
      status: 0,
    });
    await vi.advanceTimersByTimeAsync(10_000);

    await expectation;
  });

  it("preserves an external cancellation signal", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );

    const request = apiPost("/test", {}, { signal: controller.signal });
    const expectation = expect(request).rejects.toMatchObject({
      kind: "cancelled",
      status: 0,
    });
    controller.abort();

    await expectation;
  });
});

describe("apiPostFormData", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws ApiError with status 0 on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      apiPostFormData("/test", new FormData()),
    ).rejects.toMatchObject({ status: 0 });
  });

  it("throws ApiError with the response status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(400, { message: "Bad Request" })),
    );

    await expect(
      apiPostFormData("/test", new FormData()),
    ).rejects.toMatchObject({
      status: 400,
      message: "Bad Request",
    });
  });

  it("posts FormData without setting Content-Type manually", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
    const formData = new FormData();
    formData.append("file", new File(["image"], "cover.jpg"));
    vi.stubGlobal("fetch", mockFetch);

    await apiPostFormData("/test", formData);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: formData,
      }),
    );
    expect(mockFetch.mock.calls[0]?.[1]).not.toHaveProperty("headers");
  });
});

describe("apiPostVoid", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts without a JSON body and returns void", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(204, {}));
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiPostVoid("/logout")).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/logout"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("throws ApiError with response message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(401, { message: "Unauthorized" })),
    );

    await expect(apiPostVoid("/logout")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });
});

describe("apiPostJsonVoid", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a JSON body without requiring a response body", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(204, {}));
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      apiPostJsonVoid("/password-reset", { token: "token" }),
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/password-reset"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "token" }),
      }),
    );
  });
});

describe("apiPatch", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON patch bodies and parses the response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(makeTextResponse(200, JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiPatch("/profile", { name: "Ramon" })).resolves.toEqual({
      ok: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/profile"),
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ramon" }),
      }),
    );
  });

  it("throws ApiError with status 0 on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiPatch("/test", {})).rejects.toMatchObject({ status: 0 });
  });

  it("throws ApiError with the response status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(400, { message: "Bad Request" })),
    );

    await expect(apiPatch("/test", {})).rejects.toMatchObject({
      status: 400,
      message: "Bad Request",
    });
  });
});

describe("apiPatchVoid", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("patches without a JSON body and returns void", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeTextResponse(204, ""));
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiPatchVoid("/publish")).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/publish"),
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
      }),
    );
  });

  it("throws ApiError with response message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(401, { message: "Unauthorized" })),
    );

    await expect(apiPatchVoid("/publish")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });

  it("throws ApiError with status 0 on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiPatchVoid("/publish")).rejects.toMatchObject({
      status: 0,
    });
  });
});

describe("apiGet", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws ApiError with status 0 on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiGet("/test")).rejects.toMatchObject({ status: 0 });
  });

  it("throws ApiError with the response status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeMockResponse(403, { message: "Forbidden" })),
    );

    await expect(apiGet("/test")).rejects.toMatchObject({ status: 403 });
  });

  it("returns the parsed JSON body on a 2xx response", async () => {
    const data = { nextStep: "dashboard" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeMockResponse(200, data)),
    );

    await expect(apiGet("/test")).resolves.toEqual(data);
  });

  it("calls fetch with GET method and credentials include", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
    vi.stubGlobal("fetch", mockFetch);

    await apiGet("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });
});
