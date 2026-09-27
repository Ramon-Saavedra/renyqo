import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/lib/api/auth";
import { getProviderDashboardObjects } from "../api/provider-dashboard";
import { getProviderExitedApplications } from "../api/provider-exited-applications";
import {
  getProviderActiveApplications,
  getProviderWaitingCount,
} from "../api/provider-listing-applications";
import type { DashboardObject } from "../types";
import { DashboardView } from "./DashboardView";

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

vi.mock("../api/provider-listing-applications", () => ({
  getProviderActiveApplications: vi.fn(),
  getProviderWaitingCount: vi.fn(),
}));

vi.mock("../api/provider-exited-applications", () => ({
  getProviderExitedApplications: vi.fn(),
}));

function deferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: (value: T) => {
      resolvePromise(value);
    },
  };
}

const listing: DashboardObject = {
  id: "listing-1",
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
  displayOrder: 1,
};

const anna = {
  id: "application-1",
  listingId: "listing-1",
  status: "ACTIVE" as const,
  activeAt: null,
  applicant: {
    name: "Anna Lehmann",
    peopleCount: 2,
    warnings: [],
    introduction: "Kurze Vorstellung",
  },
};

const clara = {
  ...anna,
  id: "application-2",
  applicant: {
    ...anna.applicant,
    name: "Clara Klein",
    introduction: "Neue Vorstellung",
  },
};

function listingCell(): HTMLElement {
  const cell = document.querySelector<HTMLElement>("[data-listing-cell]");
  if (!cell) throw new Error("Missing listing cell");
  return cell;
}

describe("DashboardView selected applicant preload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-1",
      name: "Ramon Saavedra",
      email: "ramon@example.com",
      role: "provider",
      providerType: "company",
      companyName: "Renyqo Immobilien",
    });
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [],
      totalCount: 0,
    });
  });

  it("does not restore stale applicant names when objects refresh first", async () => {
    const refreshedObjects = deferred<readonly DashboardObject[]>();
    const refreshedApplications = deferred<readonly (typeof anna)[]>();
    vi.mocked(getProviderDashboardObjects)
      .mockResolvedValueOnce([listing])
      .mockImplementationOnce(() => refreshedObjects.promise);
    vi.mocked(getProviderActiveApplications)
      .mockResolvedValueOnce([anna])
      .mockImplementationOnce(() => refreshedApplications.promise);

    render(<DashboardView />);

    await waitFor(() => {
      expect(document.querySelector("[data-listing-cell]")).not.toBeNull();
    });

    expect(
      await within(listingCell()).findByRole("button", {
        name: "Anna Lehmann",
      }),
    ).not.toBeNull();

    window.dispatchEvent(new Event("focus"));

    await waitFor(() => {
      expect(getProviderDashboardObjects).toHaveBeenCalledTimes(2);
      expect(getProviderActiveApplications).toHaveBeenCalledTimes(2);
    });

    refreshedObjects.resolve([
      {
        ...listing,
        updatedAt: "03.07.2026, 12:00",
      },
    ]);

    await waitFor(() => {
      expect(
        within(listingCell()).queryByRole("button", { name: "Anna Lehmann" }),
      ).toBeNull();
    });
    expect(
      within(listingCell()).getByRole("button", {
        name: "Bewerbername anzeigen",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();

    refreshedApplications.resolve([clara]);

    expect(
      await within(listingCell()).findByRole("button", {
        name: "Clara Klein",
      }),
    ).not.toBeNull();
    expect(
      within(listingCell()).queryByRole("button", { name: "Anna Lehmann" }),
    ).toBeNull();
    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(screen.getByText("Clara Klein")).not.toBeNull();
  });
});
