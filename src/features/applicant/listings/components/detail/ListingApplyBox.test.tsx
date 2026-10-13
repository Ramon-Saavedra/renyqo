import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdmission } from "../../testing/admission";

import type { ApplicationAdmission } from "../../api/application-admission";

import type { ListingViewerSessionStatus } from "../../hooks/useListingViewerSession";

import type {
  ListingApplicationPublicReason,
  ProfileMatchResult,
} from "../../types";

import { subscribeListingApplicationData } from "../../utils/listing-data-invalidation";

import { ListingApplyBox } from "./ListingApplyBox";

const submit = vi.fn();

const withdraw = vi.fn();

const eligibility = vi.fn();

vi.mock("../../hooks/useListingEligibility", () => ({
  useListingEligibility: () => eligibility(),
}));

vi.mock("../../hooks/useListingApplication", () => ({
  useListingApplication: () => ({
    state: { status: "idle" },
    submit,
    reset: vi.fn(),
    reconcile: vi.fn(),
  }),
}));

vi.mock("../../hooks/useListingWithdrawal", () => ({
  useListingWithdrawal: () => ({ state: { status: "idle" }, withdraw }),
}));

function setup(
  admission: ApplicationAdmission = createAdmission(),
  matchesProfile: ProfileMatchResult = "match",
  session: ListingViewerSessionStatus = "applicant",
  publicReason: ListingApplicationPublicReason | null = null,
) {
  return render(
    <ListingApplyBox
      listingId="listing"
      session={session}
      matchesProfile={matchesProfile}
      admission={admission}
      publicReason={publicReason}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  eligibility.mockReturnValue({
    status: "loaded",
    eligibility: { canApply: true, reasons: [], warnings: [] },
  });
});

describe("ListingApplyBox admission", () => {
  it("follows refreshed admission after rejection, restoration, withdrawal and renewed rejection", () => {
    const rejected = createAdmission({
      hasApplicationHistory: true,
      canSubmitApplication: false,
      submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
      reapplyAvailableAt: "2026-11-01T00:00:00Z",
    });
    const view = setup(rejected);
    const update = (
      admission: ApplicationAdmission,
      matchesProfile: ProfileMatchResult = "match",
    ) =>
      view.rerender(
        <ListingApplyBox
          listingId="listing"
          session="applicant"
          matchesProfile={matchesProfile}
          admission={admission}
          publicReason={null}
        />,
      );
    expect(screen.getByText("Nicht ausgewählt")).toBeTruthy();
    update(
      createAdmission({
        hasApplicationHistory: true,
        currentApplicationId: "restored",
        currentApplicationStatus: "ACTIVE",
        canSubmitApplication: false,
        submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
      }),
    );
    expect(screen.getByText("Bereits beworben")).toBeTruthy();
    update(createAdmission({ hasApplicationHistory: true }));
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
    expect(screen.queryByText("Nicht ausgewählt")).toBeNull();
    update(
      createAdmission({
        hasApplicationHistory: true,
        canSubmitApplication: false,
        submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
      }),
      "no-match",
    );
    expect(screen.getByText("Passt nicht zu deinem Profil")).toBeTruthy();
    expect(screen.queryByText("Nicht ausgewählt")).toBeNull();
    update(createAdmission({ hasApplicationHistory: true }));
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
    update(rejected);
    expect(screen.getByText("Nicht ausgewählt")).toBeTruthy();
    update(createAdmission({ hasApplicationHistory: true }));
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
    expect(screen.queryByText(/2026|gesperrt|Erneut bewerben ab/)).toBeNull();
  });
  it.each(["ACTIVE", "WAITING"] as const)(
    "shows %s as current with withdrawal",
    (status) => {
      setup(
        createAdmission({
          currentApplicationId: "a",
          currentApplicationStatus: status,
          canSubmitApplication: false,
          submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
        }),
      );

      expect(screen.getByText("Bereits beworben")).toBeTruthy();

      expect(
        screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
      ).toBeTruthy();
    },
  );

  it("permits fresh submission with historical attempts and backend permission", () => {
    setup(createAdmission({ hasApplicationHistory: true }));

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);

    expect(screen.queryByText("Bereits beworben")).toBeNull();
  });

  it("uses admission permission independently of eligibility canApply", () => {
    eligibility.mockReturnValue({
      status: "loaded",
      eligibility: { canApply: false, reasons: [], warnings: [] },
    });

    setup();

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("shows current non-match after PROFILE_NO_LONGER_ELIGIBLE", () => {
    setup(
      createAdmission({
        hasApplicationHistory: true,
        canSubmitApplication: false,
        submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
      }),
      "no-match",
      "applicant",
      "PROFILE_NO_LONGER_ELIGIBLE",
    );

    expect(screen.getByText("Bewerbung beendet")).toBeTruthy();
    expect(screen.getByText("Passt nicht")).toBeTruthy();
    expect(
      screen.getByText(
        "Deine vorherige Bewerbung wurde beendet, weil dein Profil die Voraussetzungen nicht mehr erfüllt.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Bereits beworben")).toBeNull();

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("keeps an active application beside a current mismatch and still offers withdrawal", () => {
    setup(
      createAdmission({
        currentApplicationId: "a",
        currentApplicationStatus: "ACTIVE",
        canSubmitApplication: false,
        submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
      }),
      "no-match",
    );

    expect(screen.getByText("Bereits beworben")).toBeTruthy();
    expect(screen.getByText("Passt nicht")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
    ).toBeTruthy();
  });

  it("allows a new application after the profile matches again", () => {
    setup(
      createAdmission({ hasApplicationHistory: true }),
      "match",
      "applicant",
      "PROFILE_NO_LONGER_ELIGIBLE",
    );

    expect(screen.getByText("Bewerbung beendet")).toBeTruthy();
    expect(screen.getByText("Passt")).toBeTruthy();
    expect(
      screen.queryByText(
        "Deine vorherige Bewerbung wurde beendet, weil dein Profil die Voraussetzungen nicht mehr erfüllt.",
      ),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("does not claim the profile still fails after it matches again", () => {
    setup(
      createAdmission({
        hasApplicationHistory: true,
        canSubmitApplication: false,
        submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
      }),
      "match",
      "applicant",
      "PROFILE_NO_LONGER_ELIGIBLE",
    );

    expect(screen.getByText("Bewerbung beendet")).toBeTruthy();
    expect(screen.getByText("Passt")).toBeTruthy();
    expect(
      screen.queryByText(
        "Deine vorherige Bewerbung wurde beendet, weil dein Profil die Voraussetzungen nicht mehr erfüllt.",
      ),
    ).toBeNull();
    expect(
      screen.queryByText(
        "Dein Profil erfüllt die Voraussetzungen derzeit nicht.",
      ),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("shows polite not-selected copy while hiding the internal cooldown date", () => {
    setup(
      createAdmission({
        canSubmitApplication: false,
        submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
        reapplyAvailableAt: "2000-01-01T00:00:00Z",
      }),
    );

    expect(screen.getByText("Nicht ausgewählt")).toBeTruthy();
    expect(screen.getByText(/leider nicht ausgew/)).toBeTruthy();
    expect(
      screen.queryByText(/Erneut bewerben ab|2000|Wartezeit|gesperrt/),
    ).toBeNull();

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);

    expect(screen.queryByText("Bereits beworben")).toBeNull();
  });

  it.each([
    "APPLICATION_ACCEPTED",
    "LISTING_RENTED",
    "APPLICATION_HISTORY_REQUIRES_REVIEW",
    "LISTING_NOT_ACCEPTING_APPLICATIONS",
  ] as const)("preserves %s blocking", (reason) => {
    setup(
      createAdmission({
        canSubmitApplication: false,
        submissionBlockReason: reason,
      }),
    );

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it.each(["loading", "error", "other"] as const)(
    "has no applicant action for %s session",
    (session) => {
      setup(createAdmission(), "match", session);

      expect(screen.queryByRole("button", { name: "Bewerben" })).toBeNull();
    },
  );

  it("guides anonymous users to registration", () => {
    setup(createAdmission(), "match", "anonymous");

    expect(screen.getByRole("link").getAttribute("href")).toContain("register");
  });

  it("invalidates listing data after withdrawal", async () => {
    const listener = vi.fn();

    const unsubscribe = subscribeListingApplicationData(listener);

    withdraw.mockResolvedValue(true);

    setup(
      createAdmission({
        currentApplicationId: "a",
        currentApplicationStatus: "ACTIVE",
        canSubmitApplication: false,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
    );

    await waitFor(() => expect(listener).toHaveBeenCalledOnce());

    unsubscribe();
  });
});
