import { Building, Lock } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  isApplicantRole,
  isProviderRole,
  ROLE_GLYPHS,
  resolveRole,
} from "./role";

describe("resolveRole", () => {
  it('returns "provider" for "provider"', () => {
    expect(resolveRole("provider")).toBe("provider");
  });

  it('returns "applicant" for "applicant"', () => {
    expect(resolveRole("applicant")).toBe("applicant");
  });

  it('returns "applicant" for an unknown string', () => {
    expect(resolveRole("admin")).toBe("applicant");
  });

  it('returns "applicant" for undefined', () => {
    expect(resolveRole(undefined)).toBe("applicant");
  });
});

describe("ROLE_GLYPHS", () => {
  it("maps applicant to Lock icon", () => {
    expect(ROLE_GLYPHS.applicant).toBe(Lock);
  });

  it("maps provider to Building icon", () => {
    expect(ROLE_GLYPHS.provider).toBe(Building);
  });
});

describe("role predicates", () => {
  it("accept uppercase and whitespace around roles", () => {
    expect(isApplicantRole(" APPLICANT ")).toBe(true);
    expect(isProviderRole(" PROVIDER ")).toBe(true);
  });

  it("reject unknown and missing roles", () => {
    expect(isApplicantRole("admin")).toBe(false);
    expect(isProviderRole(undefined)).toBe(false);
  });
});
