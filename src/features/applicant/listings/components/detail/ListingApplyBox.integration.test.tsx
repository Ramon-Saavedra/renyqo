import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as apiClient from "@/lib/api/client";
import { ApiError, apiPost } from "@/lib/api/client";
import type { ApplicationAdmission } from "../../api/application-admission";
import { createAdmission } from "../../testing/admission";
import { ListingApplyBox } from "./ListingApplyBox";

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof apiClient>()),
  apiPost: vi.fn(),
}));

function box(admission: ApplicationAdmission) {
  return (
    <ListingApplyBox
      listingId="listing"
      session="applicant"
      matchesProfile="match"
      admission={admission}
      publicReason={null}
    />
  );
}

beforeEach(() => vi.clearAllMocks());

describe("ListingApplyBox conflict reconciliation", () => {
  it("keeps a generic eligibility rejection visible after admission refetch and permits retry", async () => {
    vi.mocked(apiPost).mockRejectedValue(
      new ApiError(
        422,
        "internal eligibility diagnostics",
        "http",
        "APPLICANT_NOT_ELIGIBLE",
        {
          canApply: false,
          evaluatedAt: "2026-10-19T12:00:00.000Z",
          reasons: ["household_income_below_requirement"],
          warnings: [],
        },
      ),
    );
    const view = render(box(createAdmission()));
    fireEvent.click(screen.getByRole("button", { name: "Bewerben" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Dein Profil erfüllt die Voraussetzungen derzeit nicht.",
    );
    view.rerender(box(createAdmission({ hasApplicationHistory: true })));
    expect(screen.getByRole("alert").textContent).toBe(
      "Dein Profil erfüllt die Voraussetzungen derzeit nicht.",
    );
    expect(
      screen.queryByText(/internal eligibility|household_income/),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Bewerben" }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Dein Profil erfüllt die Voraussetzungen derzeit nicht.",
    );
  });
  it.each([
    createAdmission({ hasApplicationHistory: true }),
    createAdmission({
      hasApplicationHistory: true,
      currentApplicationId: "restored",
      currentApplicationStatus: "ACTIVE",
      canSubmitApplication: false,
      submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
    }),
    createAdmission({
      hasApplicationHistory: true,
      canSubmitApplication: false,
      submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
    }),
  ])(
    "discards a superseded rejection with refreshed admission %j",
    async (admission) => {
      vi.mocked(apiPost).mockRejectedValueOnce(
        new ApiError(
          409,
          "internal",
          "http",
          "APPLICATION_REAPPLICATION_COOLDOWN",
        ),
      );
      const view = render(box(createAdmission()));
      fireEvent.click(screen.getByRole("button", { name: "Bewerben" }));
      await screen.findByRole("alert");
      expect(screen.getByRole("alert").textContent).toContain(
        "nicht ausgewählt",
      );
      view.rerender(box(admission));
      await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
      expect(screen.queryByText(/nicht ausgewählt/)).toBeNull();
      if (admission.canSubmitApplication) {
        expect(
          screen
            .getByRole("button", { name: "Bewerben" })
            .hasAttribute("disabled"),
        ).toBe(false);
      } else if (admission.currentApplicationId) {
        expect(
          screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
        ).toBeTruthy();
      } else {
        expect(screen.queryByText(/Dein Profil erfüllt/)).toBeNull();
        expect(
          screen
            .getByRole("button", { name: "Bewerben" })
            .hasAttribute("disabled"),
        ).toBe(true);
      }
    },
  );

  it("keeps a rejection while refreshed admission still reports the same block", async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(
      new ApiError(
        409,
        "internal",
        "http",
        "APPLICATION_REAPPLICATION_COOLDOWN",
      ),
    );
    const view = render(box(createAdmission()));
    fireEvent.click(screen.getByRole("button", { name: "Bewerben" }));
    await screen.findByRole("alert");
    view.rerender(
      box(
        createAdmission({
          canSubmitApplication: false,
          submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
          reapplyAvailableAt: "2026-11-01T00:00:00Z",
        }),
      ),
    );
    expect(screen.getByRole("alert").textContent).toContain("nicht ausgewählt");
    expect(
      screen.getByRole("button", { name: "Bewerben" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.queryByText(/2026|Erneut bewerben ab/)).toBeNull();
  });

  it.each([
    new ApiError(500, "internal"),
    new ApiError(409, "internal"),
    new ApiError(409, "internal", "http", "UNKNOWN"),
  ])(
    "preserves technical and unclassified errors on admission refresh",
    async (error) => {
      vi.mocked(apiPost).mockRejectedValueOnce(error);
      const view = render(box(createAdmission()));
      fireEvent.click(screen.getByRole("button", { name: "Bewerben" }));
      const alert = await screen.findByRole("alert");
      const message = alert.textContent;
      view.rerender(box(createAdmission({ hasApplicationHistory: true })));
      expect(screen.getByRole("alert").textContent).toBe(message);
    },
  );
});
