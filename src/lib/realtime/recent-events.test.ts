import { afterEach, describe, expect, it } from "vitest";
import {
  clearRecentEvents,
  rememberEvent,
  recentEventCount,
} from "./recent-events";

describe("recent events", () => {
  afterEach(() => {
    clearRecentEvents();
  });

  it("remembers an event id once", () => {
    expect(rememberEvent("event-1")).toBe(true);
    expect(rememberEvent("event-1")).toBe(false);
    expect(recentEventCount()).toBe(1);
  });

  it("forgets ids outside the last 100", () => {
    for (let index = 0; index < 100; index += 1) {
      expect(rememberEvent(`event-${index}`)).toBe(true);
    }
    expect(rememberEvent("event-0")).toBe(false);
    expect(rememberEvent("event-100")).toBe(true);
    expect(rememberEvent("event-0")).toBe(true);
    expect(recentEventCount()).toBe(100);
  });
});
