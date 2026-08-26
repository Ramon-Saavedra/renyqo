import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CandidatesSection } from "./CandidatesSection";
import type { Candidate, DashboardObject } from "../types";

const publishedObject: DashboardObject = {
  id: "object-1",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte",
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
  },
];

const fiveCandidates: readonly Candidate[] = Array.from(
  { length: 5 },
  (_, index) => ({
    id: `candidate-${index + 1}`,
    objectId: "object-1",
    initials: `C${index + 1}`,
    name: `Candidate ${index + 1}`,
    household: "2 Personen",
  }),
);

describe("CandidatesSection", () => {
  it("renders the compact active occupancy indicator in the section header", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("1 / 5 aktiv")).not.toBeNull();
  });

  it("renders one active candidate and four empty slots", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getAllByText("Freier Platz")).toHaveLength(4);
  });

  it("renders five empty slots when there are zero active candidates", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText("Freier Platz")).toHaveLength(5);
  });

  it("renders five active candidate cards without empty slots", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={fiveCandidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText(/Candidate /)).toHaveLength(5);
    expect(screen.queryByText("Freier Platz")).toBeNull();
  });

  it("renders at most five active candidate cards even when more are provided", () => {
    const sixCandidates: readonly Candidate[] = Array.from(
      { length: 6 },
      (_, index) => ({
        id: `candidate-${index + 1}`,
        objectId: "object-1",
        initials: `C${index + 1}`,
        name: `Candidate ${index + 1}`,
        household: "2 Personen",
      }),
    );

    render(
      <CandidatesSection
        object={publishedObject}
        candidates={sixCandidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText(/Candidate /)).toHaveLength(5);
    expect(screen.queryByText("Candidate 6")).toBeNull();
    expect(screen.queryByText("Freier Platz")).toBeNull();
  });

  it("renders the neutral empty waiting row when waiting count is zero", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText(
        "Aktuell keine weiteren passenden Bewerbungen in der Warteschlange",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders singular waiting copy for one waiting application", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 1 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText("1 weitere passende Bewerbung wartet"),
    ).not.toBeNull();
  });

  it("renders plural waiting copy for multiple waiting applications", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 3 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText("3 weitere passende Bewerbungen warten"),
    ).not.toBeNull();
  });

  it("shows waiting-count error without rendering a fake zero", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "error" }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText("Warteschlange konnte nicht geladen werden."),
    ).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("weitere passende Bewerbung wartet")).toBeNull();
    expect(
      screen.queryByText("weitere passende Bewerbungen warten"),
    ).toBeNull();
  });

  it("never renders waiting applicant identities", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 2 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText(/waiting applicant/i)).toBeNull();
    expect(screen.queryAllByText(/@/)).toHaveLength(0);
  });

  it("renders a draft message instead of candidates for draft objects", () => {
    render(
      <CandidatesSection
        object={draftObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText(
        "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Anna Lehmann")).toBeNull();
  });

  it("renders five empty slots when no object is selected", () => {
    render(
      <CandidatesSection
        object={null}
        candidates={candidates}
        waitingCountState={{ status: "idle" }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(screen.getAllByText("Freier Platz")).toHaveLength(5);
  });

  it("shows an application error while still rendering active candidates", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "error" }}
        isLoading={false}
        hasError={true}
      />,
    );

    expect(
      screen.getByText(
        "Bewerbungen konnten nicht geladen werden. Bitte versuche es gleich erneut.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(
      screen.getByText("Warteschlange konnte nicht geladen werden."),
    ).not.toBeNull();
  });

  it("shows loading placeholders instead of candidate cards", () => {
    const { container } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "loading" }}
        isLoading={true}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(screen.queryByText("Freier Platz")).toBeNull();
    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
    expect(screen.getByTestId("waiting-queue-skeleton")).not.toBeNull();
  });
});
