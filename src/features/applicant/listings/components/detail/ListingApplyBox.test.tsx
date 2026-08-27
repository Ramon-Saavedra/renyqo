import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListingApplyBox } from "./ListingApplyBox";

const eligibility = vi.fn();
const application = vi.fn();
const existing = vi.fn();
const withdrawal = vi.fn();

vi.mock("../../hooks/useListingEligibility", () => ({
  useListingEligibility: () => eligibility(),
}));
vi.mock("../../hooks/useListingApplication", () => ({
  useListingApplication: () => application(),
}));
vi.mock("../../hooks/useApplicantListingApplication", () => ({
  useApplicantListingApplication: () => existing(),
}));
vi.mock("../../hooks/useListingWithdrawal", () => ({
  useListingWithdrawal: () => withdrawal(),
}));

const baseEligibility = {
  status: "loaded",
  eligibility: {
    canApply: true,
    reasons: [],
    warnings: [],
    evaluatedAt: "2026-08-23T10:00:00.000Z",
  },
} as const;
const idle = { state: { status: "idle" }, submit: vi.fn() } as const;
const idleWithdraw = { state: { status: "idle" }, withdraw: vi.fn() } as const;
const app = (
  status: "ACTIVE" | "WAITING" | "WITHDRAWN" | "REJECTED" | "ACCEPTED",
  id = "a",
) => ({
  id,
  listingId: "l",
  status,
  rejectedAt: null,
  publicReason: null,
  createdAt: "2026-08-23T10:00:00.000Z",
  updatedAt: "2026-08-23T10:00:00.000Z",
  listing: { title: "x", city: "x", coldRent: 1, imageUrl: null },
});

function setup(
  existingApplication: ReturnType<typeof app> | null = null,
  canApply = true,
) {
  eligibility.mockReturnValue({
    ...baseEligibility,
    eligibility: { ...baseEligibility.eligibility, canApply },
  });
  application.mockReturnValue(idle);
  existing.mockReturnValue({
    application: existingApplication,
    status: "loaded",
    refresh: vi.fn(),
  });
  withdrawal.mockReturnValue(idleWithdraw);
  render(<ListingApplyBox listingId="l" matchesProfile="unknown" />);
}

describe("ListingApplyBox", () => {
  it.each(["ACTIVE", "WAITING"] as const)(
    "shows withdrawal for existing %s",
    (status) => {
      setup(app(status));
      expect(
        screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
      ).toBeInstanceOf(HTMLButtonElement);
    },
  );

  it("allows applying again after WITHDRAWN when eligibility allows it", () => {
    setup(app("WITHDRAWN"), true);
    expect(
      (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("blocks withdrawn applications when current eligibility blocks", () => {
    setup(app("WITHDRAWN"), false);
    expect(
      (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it.each(["REJECTED", "ACCEPTED"] as const)(
    "blocks %s without withdrawal",
    (status) => {
      setup(app(status));
      expect(
        screen.queryByRole("button", { name: "Bewerbung zurückziehen" }),
      ).toBeNull();
      expect(
        (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    },
  );

  it("does not block warnings when eligibility allows applying", () => {
    eligibility.mockReturnValue({
      status: "loaded",
      eligibility: {
        ...baseEligibility.eligibility,
        warnings: ["smoking_by_arrangement"],
      },
    });
    application.mockReturnValue(idle);
    existing.mockReturnValue({
      application: null,
      status: "loaded",
      refresh: vi.fn(),
    });
    withdrawal.mockReturnValue(idleWithdraw);
    render(<ListingApplyBox listingId="l" matchesProfile="unknown" />);
    expect(
      (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("submits once on repeated clicks", () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    eligibility.mockReturnValue(baseEligibility);
    application.mockReturnValue({ state: { status: "idle" }, submit });
    existing.mockReturnValue({
      application: null,
      status: "loaded",
      refresh: vi.fn(),
    });
    withdrawal.mockReturnValue(idleWithdraw);
    render(<ListingApplyBox listingId="l" matchesProfile="unknown" />);
    const button = screen.getByRole("button", { name: "Bewerben" });
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
