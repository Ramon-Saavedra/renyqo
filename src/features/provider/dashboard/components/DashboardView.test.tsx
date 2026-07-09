import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/lib/api/auth";
import { DashboardView } from "./DashboardView";
import type { Candidate, DashboardObject } from "../types";

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

const objects: readonly DashboardObject[] = [
  {
    id: "first-object",
    title: "Erste Wohnung",
    fullTitle: "Erste Wohnung in Berlin",
    district: "Berlin-Mitte",
    address: "Torstraße 1, 10119 Berlin",
    coldRent: 900,
    livingArea: 60,
    rooms: "2",
    availableFrom: "01.08.2026",
    status: "published",
    activeApplications: 1,
  },
  {
    id: "second-object",
    title: "Zweite Wohnung",
    fullTitle: "Zweite Wohnung in Hamburg",
    district: "Hamburg-Altona",
    address: "Elbchaussee 2, 22765 Hamburg",
    coldRent: 1200,
    livingArea: 75,
    rooms: "3",
    availableFrom: null,
    status: "draft",
    activeApplications: 0,
  },
];

const candidates: readonly Candidate[] = [
  {
    id: "candidate-first",
    objectId: "first-object",
    initials: "AA",
    name: "Anna A.",
    household: "2 Personen",
    badge: "match",
    attrs: [{ label: "Einkommen", value: "Vollständig", state: "ok" }],
  },
  {
    id: "candidate-second",
    objectId: "second-object",
    initials: "BB",
    name: "Ben B.",
    household: "1 Person",
    badge: "askback",
    attrs: [{ label: "Einkommen", value: "Offen", state: "open" }],
  },
];

describe("DashboardView", () => {
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
  });

  it("renders dashboard stats, the selected object, and matching candidates", async () => {
    render(<DashboardView objects={objects} candidates={candidates} />);

    expect(await screen.findByText("Ramon Saavedra")).not.toBeNull();
    expect(screen.getByText("Anzahl Objekte")).not.toBeNull();
    expect(screen.getByText("Erste Wohnung in Berlin")).not.toBeNull();
    expect(screen.getByText("Anna A.")).not.toBeNull();
  });

  it("changes the selected object from the object selector", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} candidates={candidates} />);

    await screen.findByText("Ramon Saavedra");
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
  });

  it("shows empty object selectors when the search has no matches", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} candidates={candidates} />);

    await screen.findByText("Ramon Saavedra");
    await user.type(
      screen.getByRole("searchbox", { name: "Mietobjekte durchsuchen" }),
      "nicht vorhanden",
    );

    expect(
      screen.getAllByText("Keine Objekte gefunden.").length,
    ).toBeGreaterThan(0);
  });

  it("collapses and reopens the desktop sidebar", async () => {
    const user = userEvent.setup();
    render(<DashboardView objects={objects} candidates={candidates} />);

    await screen.findByText("Ramon Saavedra");
    await user.click(screen.getByRole("button", { name: /Ausblenden/i }));

    expect(
      screen.getByRole("button", { name: /Objekte einblenden/i }),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: /Objekte einblenden/i }),
    );

    expect(screen.getAllByText("Meine Mietobjekte · 2").length).toBeGreaterThan(
      0,
    );
  });
});
