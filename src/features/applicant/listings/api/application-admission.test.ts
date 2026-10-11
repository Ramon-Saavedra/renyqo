import { describe, expect, it } from "vitest";
import { createAdmission } from "../testing/admission";
import { applicationAdmissionSchema } from "./application-admission";

describe("application admission contract", () => {
  it.each(Object.keys(createAdmission()))("requires %s", (key) => {
    const payload: Record<string, unknown> = { ...createAdmission() };
    delete payload[key];
    expect(applicationAdmissionSchema.safeParse(payload).success).toBe(false);
  });
  it.each([
    { canSubmitApplication: "true" },
    { hasApplicationHistory: null },
    { currentApplicationId: "" },
    { currentApplicationStatus: "OTHER" },
    { submissionBlockReason: "NOT_SELECTED" },
    { reapplyAvailableAt: "invalid" },
  ])("rejects malformed admission %j", (overrides) => {
    expect(
      applicationAdmissionSchema.safeParse({
        ...createAdmission(),
        ...overrides,
      }).success,
    ).toBe(false);
  });
  it("preserves all exact backend fields", () => {
    const payload = createAdmission({
      hasApplicationHistory: true,
      canSubmitApplication: false,
      submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
      reapplyAvailableAt: "2026-11-01T00:00:00Z",
    });
    expect(applicationAdmissionSchema.parse(payload)).toEqual(payload);
  });
});
