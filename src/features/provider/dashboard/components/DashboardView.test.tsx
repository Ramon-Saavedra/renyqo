import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/lib/api/auth";
import { rejectProviderApplication } from "../api/provider-application-rejection";
import { getProviderDashboardObjects } from "../api/provider-dashboard";
import { SELECTED_OBJECT_STORAGE_KEY } from "../copy/dashboard";
import { useSelectedListingApplications } from "../hooks/useSelectedListingApplications";
import { useExitedApplications } from "../hooks/useExitedApplications";
import { DashboardView } from "./DashboardView";
import type { Candidate, DashboardObject, ExitedApplicant } from "../types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../api/provider-dashboard", () => ({
  getProviderDashboardObjects: vi.fn(),
}));

vi.mock("../api/provider-application-rejection", () => ({
  rejectProviderApplication: vi.fn(),
}));

vi.mock("../hooks/useSelectedListingApplications", () => ({
  useSelectedListingApplications: vi.fn(),
}));

vi.mock("../hooks/useExitedApplications", () => ({
  useExitedApplications: vi.fn(),
}));

const objects: readonly DashboardObject[] = [
  {
    id: "first-object",
    title: "Erste Wohnung",
    fullTitle: "Erste Wohnung in Berlin",
    objectType: null,
    district: "Berlin-Mitte",
    address: "Torstraße 1, 10119 Berlin",
    coldRent: 900,
    livingArea: 60,
    rooms: "2",
    availableFrom: "01.08.2026",
    publishedAt: "02.07.2026, 13:00",
    updatedAt: "02.07.2026, 12:00",
    status: "published",
    activeApplicationsCount: 1,
    needsAttention: false,
    attentionReason: null,
    openQuestionsCount: 0,
  },
  {
    id: "second-object",
    title: "Zweite Wohnung",
    fullTitle: "Zweite Wohnung in Hamburg",
    objectType: null,
    district: "Hamburg-Altona",
    address: "Elbchaussee 2, 22765 Hamburg",
    coldRent: 1200,
    livingArea: 75,
    rooms: "3",
    availableFrom: null,
    publishedAt: null,
    updatedAt: "10.07.2026, 09:00",
    status: "draft",
    activeApplicationsCount: 0,
    needsAttention: false,
    attentionReason: null,
    openQuestionsCount: 0,
  },
];

const candidates: readonly Candidate[] = [
  {
    id: "candidate-first",
    objectId: "first-object",
    initials: "AA",
    name: "Anna A.",
    household: "2 Personen",
    warnings: [],
    introduction: null,
    activeAtLabel: null,
  },
];

function mockApplicationsState(
  overrides: Partial<ReturnType<typeof useSelectedListingApplications>> = {},
) {
  vi.mocked(useSelectedListingApplications).mockReturnValue({
    candidates: [],
    waitingCountState: { status: "idle" },
    isLoading: false,
    hasError: false,
    ...overrides,
  });
}

function mockExitedState(
  overrides: Partial<ReturnType<typeof useExitedApplications>> = {},
) {
  vi.mocked(useExitedApplications).mockReturnValue({
    exits: [],
    isLoading: false,
    hasError: false,
    restorationState: { status: "idle" },
    restoreCandidate: vi.fn(),
    resetRestoration: vi.fn(),
    ...overrides,
  });
}

describe("DashboardView", () => {
  it("keeps the dashboard viewport and internal-scroll shell", () => {
    const { container } = render(<DashboardView objects={objects} />);
    const dashboardShell = container.querySelector("[data-accent]");

    expect(dashboardShell).not.toBeNull();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getProviderDashboardObjects).mockResolvedValue([]);
    vi.mocked(rejectProviderApplication).mockResolvedValue();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-1",
      name: "Ramon Saavedra",
      email: "ramon@example.com",
      role: "provider",
      providerType: "company",
      companyName: "Renyqo Immobilien",
    });
    mockApplicationsState();
    mockExitedState();
  });

  it("renders dashboard stats, the selected object, and matching candidates", async () => {
    mockApplicationsState({ candidates });

    render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(screen.getAllByText("Meine Objekte").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/2 Objekte · 1 veröffentlicht · 1 Entwürfe/),
    ).not.toBeNull();
    expect(screen.getByText("Erste Wohnung in Berlin")).not.toBeNull();
    expect(screen.getByText("Anna A.")).not.toBeNull();
    expect(useSelectedListingApplications).toHaveBeenCalledWith(
      "first-object",
      "published",
    );
  });

  it("shows authoritative ACTIVE counts without progressive selection cache", async () => {
    render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(screen.getByText(/1 aktive Bewerbungen/)).not.toBeNull();
  });

  it("changes the selected object from the object selector", async () => {
    const user = userEvent.setup();
    mockApplicationsState({ candidates: [] });

    render(<DashboardView objects={objects} />);

    await screen.findByText("Saavedra");
    const secondObjectButton = screen.getAllByRole("button", {
      name: /Zweite Wohnung/i,
    })[0];
    if (!secondObjectButton) throw new Error("Second object button not found");
    await user.click(secondObjectButton);

    expect(screen.getByText("Zweite Wohnung in Hamburg")).not.toBeNull();
    expect(
      screen.getByText(
        "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
      ),
    ).not.toBeNull();
    expect(useSelectedListingApplications).toHaveBeenCalledWith(
      "second-object",
      "draft",
    );
  });

  it("restores the previously selected object", async () => {
    window.localStorage.setItem(SELECTED_OBJECT_STORAGE_KEY, "second-object");
    mockApplicationsState({ candidates: [] });

    render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(screen.getByText("Zweite Wohnung in Hamburg")).not.toBeNull();
    expect(screen.queryByText("Erste Wohnung in Berlin")).toBeNull();
  });

  it("shows empty object selectors when the search has no matches", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} />);

    await screen.findByText("Saavedra");
    await user.type(
      screen.getByRole("searchbox", { name: "Objekte durchsuchen" }),
      "nicht vorhanden",
    );

    expect(
      screen.getAllByText(/Kein Objekt gefunden für/).length,
    ).toBeGreaterThan(0);
  });

  it("keeps the selected object inside the filtered results", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} />);

    await screen.findByText("Saavedra");
    await user.type(
      screen.getByRole("searchbox", { name: "Objekte durchsuchen" }),
      "Zweite",
    );

    expect(
      document.querySelector('[data-listing-cell="second-object"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-listing-cell="first-object"]'),
    ).toBeNull();
  });

  it("keeps the dashboard layout when there is no backend data", async () => {
    render(<DashboardView />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(getProviderDashboardObjects).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Noch keine Mietobjekte")).not.toBeNull();
    expect(screen.queryByText("Erste Wohnung in Berlin")).toBeNull();
  });

  it("renders listings loaded from the provider dashboard endpoint", async () => {
    vi.mocked(getProviderDashboardObjects).mockResolvedValue([objects[0]!]);

    render(<DashboardView />);

    expect(await screen.findByText("Erste Wohnung in Berlin")).not.toBeNull();
    expect(screen.getByText(/1 Objekte ·/)).not.toBeNull();
  });

  it("refreshes listing counters after rejecting a candidate", async () => {
    const user = userEvent.setup();
    vi.mocked(getProviderDashboardObjects).mockResolvedValue([objects[0]!]);
    mockApplicationsState({ candidates });

    render(<DashboardView />);

    await screen.findByText("Erste Wohnung in Berlin");
    await user.click(screen.getByRole("button", { name: "Anna A. ablehnen" }));
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    await vi.waitFor(() => {
      expect(getProviderDashboardObjects).toHaveBeenCalledTimes(2);
    });
  });

  it("shows a server error state when dashboard listings fail to load", async () => {
    vi.mocked(getProviderDashboardObjects).mockRejectedValue(
      new Error("server error"),
    );

    render(<DashboardView />);

    expect(await screen.findByRole("alert")).not.toBeNull();
    expect(
      screen.getByText("Ihre Objekte konnten nicht geladen werden"),
    ).not.toBeNull();
  });

  it("shows an application loading and error state for the selected listing", async () => {
    mockApplicationsState({ isLoading: true });
    const { rerender } = render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(screen.queryByText("Anna A.")).toBeNull();

    mockApplicationsState({ hasError: true });
    rerender(<DashboardView objects={objects} />);

    expect(
      screen.getByText(
        "Bewerbungen konnten nicht geladen werden. Bitte versuche es gleich erneut.",
      ),
    ).not.toBeNull();
  });

  it("renders the current topbar actions", async () => {
    render(<DashboardView objects={objects} />);

    await screen.findByText("Saavedra");
    expect(screen.getByRole("link", { name: "Meine Objekte" })).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Neues Mietobjekt" }),
    ).not.toBeNull();
  });

  it("renders the recent exits rail for a published object", async () => {
    const exits: readonly ExitedApplicant[] = [
      {
        id: "exit-1",
        listingId: "first-object",
        applicantName: "Familie Weber",
        initials: "FW",
        household: "2 Personen",
        introduction: null,
        visualState: "withdrawn",
        activeAtLabel: "01.08.2026",
        exitedAtDateLabel: "30.08.2026",
      },
    ];
    mockExitedState({ exits });

    render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(screen.getByText("Kürzlich ausgeschieden")).not.toBeNull();
    expect(screen.getByText("Familie Weber")).not.toBeNull();
    expect(useExitedApplications).toHaveBeenCalledWith(
      "first-object",
      "published",
    );
  });

  it("renders the recent exits loading state", async () => {
    mockExitedState({ isLoading: true });

    const { container } = render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
  });

  it("renders the recent exits error state", async () => {
    mockExitedState({ hasError: true });

    render(<DashboardView objects={objects} />);

    expect(await screen.findByText("Saavedra")).not.toBeNull();
    expect(
      screen.getByText(
        "Kürzlich ausgeschiedene Bewerbungen konnten nicht geladen werden.",
      ),
    ).not.toBeNull();
  });

  it("hides the recent exits rail for a draft object", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} />);

    await screen.findByText("Saavedra");
    const secondObjectButton = screen.getAllByRole("button", {
      name: /Zweite Wohnung/i,
    })[0];
    if (!secondObjectButton) throw new Error("Second object button not found");
    await user.click(secondObjectButton);

    expect(useExitedApplications).toHaveBeenCalledWith(
      "second-object",
      "draft",
    );
    expect(screen.queryByText("Kürzlich ausgeschieden")).toBeNull();
  });
});
