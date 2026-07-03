import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiPost } from "./client";

function makeMockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

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
