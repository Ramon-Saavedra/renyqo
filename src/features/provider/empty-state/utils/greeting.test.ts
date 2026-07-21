import { describe, expect, it } from "vitest";

import type { SafeUser } from "@/lib/api/auth";
import { buildWelcomeGreeting } from "./greeting";

const BASE: SafeUser = {
  id: "provider-1",
  name: "Sabine Kessler",
  email: "sabine@example.com",
  role: "provider",
  providerType: "private",
  companyName: null,
};

describe("buildWelcomeGreeting", () => {
  it("greets a private provider by first name", () => {
    expect(buildWelcomeGreeting(BASE)).toBe("Willkommen bei Renyqo, Sabine.");
  });

  it("greets a company provider with the company name", () => {
    expect(
      buildWelcomeGreeting({
        ...BASE,
        providerType: "company",
        companyName: "Kessler Immobilien GbR",
      }),
    ).toBe(
      "Willkommen bei Renyqo, Sabine und das Team von Kessler Immobilien GbR.",
    );
  });

  it("normalizes a lowercase stored name", () => {
    expect(buildWelcomeGreeting({ ...BASE, name: "sabine kessler" })).toBe(
      "Willkommen bei Renyqo, Sabine.",
    );
  });

  it("falls back to the neutral greeting without a session", () => {
    expect(buildWelcomeGreeting(null)).toBe("Willkommen bei Renyqo.");
  });

  it("falls back to the neutral greeting for a blank name", () => {
    expect(buildWelcomeGreeting({ ...BASE, name: "   " })).toBe(
      "Willkommen bei Renyqo.",
    );
  });

  it("uses the private form when a company account has no company name", () => {
    expect(
      buildWelcomeGreeting({
        ...BASE,
        providerType: "company",
        companyName: "   ",
      }),
    ).toBe("Willkommen bei Renyqo, Sabine.");
  });

  it("never emits undefined", () => {
    expect(
      buildWelcomeGreeting({
        ...BASE,
        providerType: "company",
        companyName: null,
      }),
    ).not.toContain("undefined");
  });
});
