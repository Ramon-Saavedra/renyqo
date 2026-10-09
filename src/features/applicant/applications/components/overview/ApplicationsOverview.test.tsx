import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getApplicantApplicationsOverview,
  type ApplicantApplicationsPage,
} from "../../api/overview";
import type * as overviewApi from "../../api/overview";
import { overviewCard, viewingSnapshot } from "../../testing/fixtures";
import { ApplicationsOverview } from "./ApplicationsOverview";

vi.mock("../../api/overview", async (importOriginal) => {
  const actual = await importOriginal<typeof overviewApi>();
  return { ...actual, getApplicantApplicationsOverview: vi.fn() };
});

const getOverview = vi.mocked(getApplicantApplicationsOverview);

function page(
  items: ApplicantApplicationsPage["items"],
  nextCursor: string | null,
  totalCount = items.length,
): ApplicantApplicationsPage {
  return {
    asOf: "2026-10-04T09:20:00.000Z",
    items,
    pagination: { limit: 20, hasMore: nextCursor !== null, nextCursor },
    totalCount,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApplicationsOverview", () => {
  it("shows a loading state while the first page loads", () => {
    getOverview.mockReturnValue(new Promise(() => undefined));

    render(<ApplicationsOverview />);

    expect(screen.getByRole("status").textContent).toContain(
      "Bewerbungen werden geladen",
    );
  });

  it("shows the empty state with a way to find listings", async () => {
    getOverview.mockResolvedValue(page([], null));

    render(<ApplicationsOverview />);

    expect(await screen.findByText("Noch keine Bewerbungen")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Wohnungen finden" })
        .getAttribute("href"),
    ).toBe("/listings");
  });

  it("groups cards by backend status and shows only present indicators", async () => {
    getOverview.mockResolvedValue(
      page(
        [
          overviewCard({
            applicationId: "active-1",
            attention: {
              pendingActionCount: 3,
              actionableUnreadMessageCount: 1,
              hasPendingAction: true,
            },
            documents: {
              requestedCount: 2,
              uploadRequiredCount: 1,
              reviewRequiredCount: 0,
              processingCount: 0,
              reviewedCount: 0,
            },
            viewing: {
              current: viewingSnapshot(),
              latest: viewingSnapshot(),
              latestCompleted: null,
              pendingInterest: null,
              changeRequested: null,
              canPropose: false,
              nextAction: "APPLICANT_RESPOND_TO_VIEWING",
            },
          }),
          overviewCard({
            applicationId: "waiting-1",
            status: "WAITING",
            activeAt: null,
            listing: {
              id: "listing-waiting",
              title: "Altbauwohnung nahe Stadtpark",
              city: "Hamburg-Eimsbüttel",
              coldRent: 1450,
              status: "PUBLISHED",
              imageUrl: null,
            },
          }),
          overviewCard({
            applicationId: "rejected-1",
            status: "REJECTED",
            listing: {
              id: "listing-rejected",
              title: "Dachgeschosswohnung",
              city: null,
              coldRent: null,
              status: "RENTED",
              imageUrl: null,
            },
          }),
        ],
        null,
      ),
    );

    render(<ApplicationsOverview />);

    const active = await screen.findByRole("region", { name: "Aktiv" });
    const activeLink = within(active).getByRole("link");
    expect(activeLink.getAttribute("href")).toBe(
      "/applicant/applications/active-1",
    );
    expect(within(activeLink).getByText("3 offene Schritte")).toBeTruthy();
    expect(within(activeLink).getByText("1 neue Nachricht")).toBeTruthy();
    expect(within(activeLink).getByText("1 Unterlage fehlt")).toBeTruthy();
    expect(within(activeLink).getByText("Termin vorgeschlagen")).toBeTruthy();
    expect(within(activeLink).queryAllByRole("button")).toHaveLength(0);

    const waiting = screen.getByRole("region", { name: "Warteliste" });
    expect(
      within(waiting).getByText("Altbauwohnung nahe Stadtpark"),
    ).toBeTruthy();
    expect(within(waiting).queryByText(/offene/)).toBeNull();

    const done = screen.getByRole("region", { name: "Abgeschlossen" });
    expect(within(done).getByText("Absage")).toBeTruthy();
    expect(
      screen.getByText("3 Bewerbungen · 1 braucht deine Aufmerksamkeit"),
    ).toBeTruthy();
  });

  it("filters loaded cards without inventing counts for unloaded pages", async () => {
    const user = userEvent.setup();
    getOverview.mockResolvedValue(
      page(
        [
          overviewCard({ applicationId: "active-1" }),
          overviewCard({ applicationId: "waiting-1", status: "WAITING" }),
        ],
        "cursor-2",
        5,
      ),
    );

    render(<ApplicationsOverview />);

    const filter = await screen.findByRole("group", {
      name: "Bewerbungen filtern",
    });
    expect(within(filter).getByRole("button", { name: "Alle 5" })).toBeTruthy();
    expect(
      within(filter).getByRole("button", { name: "Warteliste" }),
    ).toBeTruthy();

    await user.click(
      within(filter).getByRole("button", { name: "Warteliste" }),
    );

    expect(screen.queryByRole("region", { name: "Aktiv" })).toBeNull();
    expect(screen.getByRole("region", { name: "Warteliste" })).toBeTruthy();
    expect(
      within(filter)
        .getByRole("button", { name: "Warteliste" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("loads the next backend page with the returned cursor", async () => {
    const user = userEvent.setup();
    getOverview
      .mockResolvedValueOnce(
        page([overviewCard({ applicationId: "a-1" })], "cursor-2", 2),
      )
      .mockResolvedValueOnce(
        page(
          [
            overviewCard({
              applicationId: "a-2",
              status: "ACCEPTED",
            }),
          ],
          null,
          2,
        ),
      );

    render(<ApplicationsOverview />);

    await user.click(
      await screen.findByRole("button", { name: "Weitere Bewerbungen laden" }),
    );

    expect(getOverview).toHaveBeenLastCalledWith("cursor-2", {
      signal: expect.any(AbortSignal),
    });
    expect(
      await screen.findByRole("region", { name: "Abgeschlossen" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Weitere Bewerbungen laden" }),
    ).toBeNull();
  });

  it("keeps loaded cards when the next page fails", async () => {
    const user = userEvent.setup();
    getOverview
      .mockResolvedValueOnce(
        page([overviewCard({ applicationId: "a-1" })], "cursor-2", 2),
      )
      .mockRejectedValueOnce(new Error("network"));

    render(<ApplicationsOverview />);
    await user.click(
      await screen.findByRole("button", { name: "Weitere Bewerbungen laden" }),
    );

    expect(
      await screen.findByText(
        "Weitere Bewerbungen konnten nicht geladen werden.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("offers a retry after a failed first load", async () => {
    const user = userEvent.setup();
    getOverview
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        page([overviewCard({ applicationId: "a-1" })], null),
      );

    render(<ApplicationsOverview />);

    await user.click(
      await screen.findByRole("button", { name: "Erneut versuchen" }),
    );

    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(1));
  });
});
