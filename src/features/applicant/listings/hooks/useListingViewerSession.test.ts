import { describe, expect, it } from "vitest";
import type { SafeUser } from "@/lib/api/auth";
import { resolveListingViewerSession } from "./useListingViewerSession";

const applicant: SafeUser = {
  id: "user-1",
  name: "Ada",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

const provider: SafeUser = {
  ...applicant,
  id: "user-2",
  role: "provider",
  providerType: "private",
};

describe("resolveListingViewerSession", () => {
  it("returns loading while the session is unresolved", () => {
    expect(resolveListingViewerSession(null, true)).toBe("loading");
    expect(resolveListingViewerSession(applicant, true)).toBe("loading");
  });

  it("returns anonymous when no user is present", () => {
    expect(resolveListingViewerSession(null, false)).toBe("anonymous");
  });

  it("returns applicant for an applicant session", () => {
    expect(resolveListingViewerSession(applicant, false)).toBe("applicant");
  });

  it("returns other for a non-applicant session", () => {
    expect(resolveListingViewerSession(provider, false)).toBe("other");
  });

  it("returns error when session resolution failed", () => {
    expect(resolveListingViewerSession(null, false, true)).toBe("error");
    expect(resolveListingViewerSession(applicant, false, true)).toBe("error");
  });

  it("keeps loading ahead of an error flag", () => {
    expect(resolveListingViewerSession(null, true, true)).toBe("loading");
  });
});
