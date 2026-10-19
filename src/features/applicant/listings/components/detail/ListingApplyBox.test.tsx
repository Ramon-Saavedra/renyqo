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
});

describe("ListingApplyBox admission", () => {
  it.each([false, true])(
    "shows no personalized diagnostics and preserves admission permission %s",
    (canApply) => {
      setup(
        createAdmission({
          canSubmitApplication: canApply,
          submissionBlockReason: canApply ? null : "APPLICANT_NOT_ELIGIBLE",
        }),
        canApply ? "match" : "no-match",
      );
      expect(screen.queryByRole("list")).toBeNull();
      expect(
        screen.queryByText(
          /Haushaltseinkommen|Haustiere sind|household_income_below_requirement|pets_not_allowed|pets_by_arrangement/,
        ),
      ).toBeNull();
      expect(
        (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
          .disabled,
      ).toBe(!canApply);
    },
  );
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
    expect(screen.queryByText("Passt")).toBeNull();
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
    expect(screen.queryByText("Passt")).toBeNull();
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
      expect(screen.queryByText("Passt")).toBeNull();
      expect(screen.queryByText("Passt nicht")).toBeNull();

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

  it("uses the authoritative admission permission", () => {
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
    expect(screen.queryByText("Passt nicht")).toBeNull();
    expect(
      screen.queryByText(
        "Deine vorherige Bewerbung wurde beendet, weil dein Profil die Voraussetzungen nicht mehr erfüllt.",
      ),
    ).toBeNull();
    expect(screen.queryByText("Bereits beworben")).toBeNull();

    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it.each(["ACTIVE", "WAITING"] as const)(
    "keeps a %s application actionable without the mismatch label",
    (status) => {
      setup(
        createAdmission({
          currentApplicationId: "a",
          currentApplicationStatus: status,
          canSubmitApplication: false,
          submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
        }),
        "no-match",
      );

      expect(screen.getByText("Bereits beworben")).toBeTruthy();
      expect(screen.queryByText("Passt")).toBeNull();
      expect(screen.queryByText("Passt nicht")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
      ).toBeTruthy();
    },
  );

  it("allows a new application after the profile matches again", () => {
    setup(
      createAdmission({ hasApplicationHistory: true }),
      "match",
      "applicant",
      "PROFILE_NO_LONGER_ELIGIBLE",
    );

    expect(screen.queryByText("Bewerbung beendet")).toBeNull();
    expect(screen.getByText("Passt zu deinem Profil")).toBeTruthy();
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
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Passt nicht")).toBeNull();
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
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Passt nicht")).toBeNull();
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

  it.each([
    ["APPLICATION_ACCEPTED", "Bewerbung angenommen", "ACCEPTED"],
    ["LISTING_RENTED", "Objekt vermietet", "REJECTED"],
    [
      "APPLICATION_HISTORY_REQUIRES_REVIEW",
      "Bewerbung derzeit nicht möglich",
      "REJECTED",
    ],
    [
      "LISTING_NOT_ACCEPTING_APPLICATIONS",
      "Bewerbung derzeit nicht möglich",
      "REJECTED",
    ],
  ] as const)(
    "shows %s without a compatibility label",
    (reason, label, status) => {
      setup(
        createAdmission({
          hasApplicationHistory: true,
          currentApplicationId: "closed/1",
          currentApplicationStatus: status,
          canSubmitApplication: false,
          submissionBlockReason: reason,
        }),
      );

      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.queryByText("Passt")).toBeNull();
      expect(screen.queryByText("Passt nicht")).toBeNull();
      expect(
        screen
          .getByRole("link", { name: "Zur Bewerbung" })
          .getAttribute("href"),
      ).toBe("/applicant/applications/closed%2F1");
      expect(
        screen
          .getByRole("button", { name: "Bewerben" })
          .hasAttribute("disabled"),
      ).toBe(true);
    },
  );

  it("opens the current application when there are no attention notices", () => {
    setup(
      createAdmission({
        currentApplicationId: "app/42",
        currentApplicationStatus: "ACTIVE",
        canSubmitApplication: false,
        submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
      }),
    );

    const link = screen.getByRole("link", { name: "Zur Bewerbung" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/applicant/applications/app%2F42");
    expect(
      screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
    ).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("links rejected and withdrawn applications without replacing their actions", () => {
    const view = setup(
      createAdmission({
        hasApplicationHistory: true,
        currentApplicationId: "rejected-1",
        currentApplicationStatus: "REJECTED",
        canSubmitApplication: false,
        submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
        reapplyAvailableAt: "2026-11-01T00:00:00Z",
      }),
    );

    expect(screen.getByText("Nicht ausgewählt")).toBeTruthy();
    expect(screen.queryByText("Passt")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Zur Bewerbung" }).getAttribute("href"),
    ).toBe("/applicant/applications/rejected-1");
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);

    view.rerender(
      <ListingApplyBox
        listingId="listing"
        session="applicant"
        matchesProfile="match"
        admission={createAdmission({
          hasApplicationHistory: true,
          currentApplicationId: "withdrawn-1",
          currentApplicationStatus: "WITHDRAWN",
          canSubmitApplication: true,
        })}
        publicReason={null}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Zur Bewerbung" }).getAttribute("href"),
    ).toBe("/applicant/applications/withdrawn-1");
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
    expect(
      screen.queryByRole("link", { name: "Meine Bewerbungen" }),
    ).toBeNull();
  });

  it("links application history without guessing an application id", () => {
    setup(
      createAdmission({
        hasApplicationHistory: true,
        currentApplicationId: null,
        currentApplicationStatus: "WITHDRAWN",
      }),
    );

    expect(
      screen
        .getByRole("link", { name: "Meine Bewerbungen" })
        .getAttribute("href"),
    ).toBe("/applicant/applications");
    expect(screen.queryByRole("link", { name: "Zur Bewerbung" })).toBeNull();
  });

  it("shows no application navigation without a current application or history", () => {
    setup(createAdmission());

    expect(screen.queryByRole("link", { name: "Zur Bewerbung" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Meine Bewerbungen" }),
    ).toBeNull();
  });

  it.each(["loading", "error", "other", "anonymous"] as const)(
    "shows no application navigation for %s session",
    (session) => {
      setup(
        createAdmission({
          hasApplicationHistory: true,
          currentApplicationId: "app-1",
          currentApplicationStatus: "ACTIVE",
          canSubmitApplication: false,
          submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
        }),
        "match",
        session,
      );

      expect(screen.queryByRole("link", { name: "Zur Bewerbung" })).toBeNull();
      expect(
        screen.queryByRole("link", { name: "Meine Bewerbungen" }),
      ).toBeNull();
    },
  );

  it("follows the refreshed application id after apply, withdrawal, and reapplication", () => {
    const view = setup(
      createAdmission({
        hasApplicationHistory: true,
        currentApplicationId: "first-id",
        currentApplicationStatus: "ACTIVE",
        canSubmitApplication: false,
        submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
      }),
    );
    const renderAdmission = (
      admission: Parameters<typeof createAdmission>[0],
    ) =>
      view.rerender(
        <ListingApplyBox
          listingId="listing"
          session="applicant"
          matchesProfile="match"
          admission={createAdmission({
            hasApplicationHistory: true,
            ...admission,
          })}
          publicReason={null}
        />,
      );

    expect(
      screen.getByRole("link", { name: "Zur Bewerbung" }).getAttribute("href"),
    ).toBe("/applicant/applications/first-id");

    renderAdmission({ currentApplicationId: null });
    expect(screen.queryByRole("link", { name: "Zur Bewerbung" })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Meine Bewerbungen" })
        .getAttribute("href"),
    ).toBe("/applicant/applications");

    renderAdmission({
      currentApplicationId: "reapplied-id",
      currentApplicationStatus: "WAITING",
      canSubmitApplication: false,
      submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
    });
    expect(
      screen.getByRole("link", { name: "Zur Bewerbung" }).getAttribute("href"),
    ).toBe("/applicant/applications/reapplied-id");
    expect(screen.queryByText("first-id")).toBeNull();
    expect(submit).not.toHaveBeenCalled();
    expect(withdraw).not.toHaveBeenCalled();
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
