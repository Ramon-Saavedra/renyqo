import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { safeGetItem, safeSetItem } from "./storage";

describe("safeSetItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores a value in localStorage when available", () => {
    safeSetItem("key", "value");
    expect(localStorage.getItem("key")).toBe("value");
  });

  it("does not throw when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => safeSetItem("key", "value")).not.toThrow();
  });
});

describe("safeGetItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the stored value when available", () => {
    localStorage.setItem("key", "value");
    expect(safeGetItem("key")).toBe("value");
  });

  it("returns null when the key does not exist", () => {
    expect(safeGetItem("missing")).toBeNull();
  });

  it("returns null when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });

    expect(safeGetItem("key")).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });

    expect(() => safeGetItem("key")).not.toThrow();
  });
});

describe("storage — isolated environment", () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("safeSetItem returns undefined and does not throw when localStorage is blocked", () => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("SecurityError");
      },
      configurable: true,
    });

    expect(() => safeSetItem("k", "v")).not.toThrow();
  });

  it("safeGetItem returns null and does not throw when localStorage is blocked", () => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("SecurityError");
      },
      configurable: true,
    });

    expect(safeGetItem("k")).toBeNull();
  });
});
