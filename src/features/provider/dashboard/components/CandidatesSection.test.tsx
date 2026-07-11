import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CandidatesSection } from "./CandidatesSection";
import type { Candidate, DashboardObject } from "../types";

const publishedObject: DashboardObject = {
  id: "object-1",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte",
  district: "Berlin-Mitte",
  address: "Torstraße 1, 10119 Berlin",
  coldRent: 900,
  livingArea: 60,
  rooms: "2",
  availableFrom: "01.08.2026",
  publishedAt: "02.07.2026, 13:00",
  updatedAt: "02.07.2026, 12:00",
  status: "published",
  activeApplications: 1,
};

const draftObject: DashboardObject = {
  ...publishedObject,
  id: "object-2",
  status: "draft",
};

const candidates: readonly Candidate[] = [
  {
    id: "candidate-1",
    objectId: "object-1",
    initials: "AL",
    name: "Anna Lehmann",
    household: "2 Personen",
    badge: "match",
    attrs: [{ label: "Einkommen", value: "Vollständig", state: "ok" }],
  },
];

describe("CandidatesSection", () => {
  it("renders candidates and empty slots for published objects", () => {
    render(
      <CandidatesSection object={publishedObject} candidates={candidates} />,
    );

    expect(screen.getByText("Passende Kandidaten")).not.toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getByText("1")).not.toBeNull();
    expect(
      screen.getAllByText("Platz frei für passende Bewerbung"),
    ).toHaveLength(4);
  });

  it("renders a draft message instead of candidates for draft objects", () => {
    render(<CandidatesSection object={draftObject} candidates={candidates} />);

    expect(
      screen.getByText(
        "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Anna Lehmann")).toBeNull();
  });

  it("renders five empty slots when no object is selected", () => {
    render(<CandidatesSection object={null} candidates={candidates} />);

    expect(screen.getByText("Passende Kandidaten")).not.toBeNull();
    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(
      screen.getAllByText("Platz frei für passende Bewerbung"),
    ).toHaveLength(5);
  });
});
