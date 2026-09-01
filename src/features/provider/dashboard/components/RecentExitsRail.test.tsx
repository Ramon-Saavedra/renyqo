import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecentExitsRail } from "./RecentExitsRail";
import type { ExitedApplicant } from "../types";

function buildExit(overrides: Partial<ExitedApplicant>): ExitedApplicant {
  return {
    id: "exit-1",
    listingId: "listing-1",
    applicantName: "Familie Weber",
    visualState: "withdrawn",
    exitedAt: "2026-08-30T14:23:00.000Z",
    exitedAtLabel: "30.08.2026 · 16:23",
    exitedAtLabelCompact: "30.08. · 16:23",
    ...overrides,
  };
}

describe("RecentExitsRail", () => {
  it("renders the empty-state message when there are no exits and no error", () => {
    render(
      <RecentExitsRail
        exits={[]}
        totalCount={0}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText("Noch keine ausgeschiedenen Bewerber"),
    ).not.toBeNull();
    expect(screen.getByText("Kürzlich ausgeschieden")).not.toBeNull();
  });

  it("does not show a count badge in the empty state", () => {
    render(
      <RecentExitsRail
        exits={[]}
        totalCount={0}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows the empty state without a badge when totalCount exceeds rendered items", () => {
    render(
      <RecentExitsRail
        exits={[]}
        totalCount={3}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText("Noch keine ausgeschiedenen Bewerber"),
    ).not.toBeNull();
    expect(screen.queryByText("3")).toBeNull();
  });

  it("renders the applicant name, state label, and exited date for each exit", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({})]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Familie Weber")).not.toBeNull();
    expect(screen.getByText("Bewerbung zurückgezogen")).not.toBeNull();
    expect(screen.getByText("30.08.2026 · 16:23")).not.toBeNull();
  });

  it("shows the total count in the header", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({}), buildExit({ id: "exit-2" })]}
        totalCount={9}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("9")).not.toBeNull();
  });

  it("renders the five returned items and a remaining-count tail from totalCount", () => {
    const exits = Array.from({ length: 5 }, (_, index) =>
      buildExit({
        id: `exit-${index + 1}`,
        applicantName: `Person ${index + 1}`,
      }),
    );

    render(
      <RecentExitsRail
        exits={exits}
        totalCount={7}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText(/^Person /)).toHaveLength(5);
    expect(screen.getByText("+2 weitere")).not.toBeNull();
  });

  it("does not show a remaining tail when totalCount matches the returned items", () => {
    const exits = Array.from({ length: 5 }, (_, index) =>
      buildExit({
        id: `exit-${index + 1}`,
        applicantName: `Person ${index + 1}`,
      }),
    );

    render(
      <RecentExitsRail
        exits={exits}
        totalCount={5}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText(/weitere/)).toBeNull();
  });

  it("maps a provider rejection to the provider_discarded label", () => {
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "exit-2",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
          }),
        ]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Von dir abgelehnt")).not.toBeNull();
  });

  it("maps a system removal to the system_removed label", () => {
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "exit-3",
            applicantName: "Marlene Kaufmann",
            visualState: "system_removed",
          }),
        ]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Nicht mehr verfügbar")).not.toBeNull();
  });

  it("shows an error message instead of cards when loading failed", () => {
    render(
      <RecentExitsRail
        exits={[]}
        totalCount={3}
        isLoading={false}
        hasError={true}
      />,
    );

    expect(
      screen.getByText(
        "Kürzlich ausgeschiedene Bewerbungen konnten nicht geladen werden.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Familie Weber")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
  });

  it("keeps preserved exits visible when a refresh failed", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({})]}
        totalCount={1}
        isLoading={false}
        hasError={true}
      />,
    );

    expect(screen.getByText("Familie Weber")).not.toBeNull();
    expect(
      screen.getByText(
        "Kürzlich ausgeschiedene Bewerbungen konnten nicht geladen werden.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("1")).not.toBeNull();
  });

  it("shows loading placeholders instead of exit cards", () => {
    const { container } = render(
      <RecentExitsRail
        exits={[]}
        totalCount={3}
        isLoading={true}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Familie Weber")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
    expect(container.getElementsByClassName("sk-circle").length).toBe(5);
  });

  it("clamps the remaining count when totalCount is below the rendered items", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({}), buildExit({ id: "exit-2" })]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText(/weitere/)).toBeNull();
  });
});
