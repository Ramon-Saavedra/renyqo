import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecentExitsRail as RecentExitsRailView } from "./RecentExitsRail";
import type { RecentExitsRailProps } from "./RecentExitsRail";
import type { ExitedApplicant } from "../types";

const onRestore = vi.fn<(applicationId: string) => Promise<boolean>>();
const onResetRestoration = vi.fn();

function RecentExitsRail(
  props: Omit<
    RecentExitsRailProps,
    "restorationState" | "onRestore" | "onResetRestoration"
  >,
) {
  return (
    <RecentExitsRailView
      {...props}
      restorationState={{ status: "idle" }}
      onRestore={onRestore}
      onResetRestoration={onResetRestoration}
    />
  );
}

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
  beforeEach(() => {
    vi.clearAllMocks();
    onRestore.mockResolvedValue(true);
  });
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

  it("contains the absolutely positioned state label within its card", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({})]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    const stateLabel = screen.getByText("Bewerbung zurückgezogen");
    const card = stateLabel.closest(".relative");

    expect(card?.classList.contains("relative")).toBe(true);
    expect(card?.classList.contains("bg-exit-withdrawn-bg")).toBe(true);
    expect(card?.classList.contains("border-exit-withdrawn-fg/35")).toBe(true);
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

    const stateLabel = screen.getByText("Von dir abgelehnt");
    const card = stateLabel.closest(".relative");

    expect(card?.classList.contains("bg-exit-provider-discarded-bg")).toBe(
      true,
    );
    expect(
      card?.classList.contains("border-exit-provider-discarded-fg/35"),
    ).toBe(true);
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

    const stateLabel = screen.getByText("Nicht mehr verfügbar");
    const card = stateLabel.closest(".relative");

    expect(card?.classList.contains("bg-background-subtle")).toBe(true);
    expect(card?.classList.contains("border-border-strong")).toBe(true);
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

  it("shows a restore button only for provider_discarded exits", () => {
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
          }),
          buildExit({ id: "app-2", visualState: "withdrawn" }),
          buildExit({ id: "app-3", visualState: "system_removed" }),
        ]}
        totalCount={3}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Jonas Brandt wieder aufnehmen" }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Familie Weber wieder aufnehmen" }),
    ).toBeNull();
  });

  it("opens the restore confirmation and cancels without calling the backend", async () => {
    const user = userEvent.setup();
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
          }),
        ]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Jonas Brandt wieder aufnehmen" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Möchtest du Jonas Brandt wieder in die Bewerbungen aufnehmen?",
      ),
    ).not.toBeNull();

    await user.click(screen.getAllByRole("button", { name: "Abbrechen" })[1]!);

    expect(onRestore).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Jonas Brandt")).not.toBeNull();
  });

  it("closes a restore confirmation when the selected listing changes", async () => {
    const user = userEvent.setup();
    const exit = buildExit({
      id: "app-1",
      applicantName: "Jonas Brandt",
      visualState: "provider_discarded",
    });
    const { rerender } = render(
      <RecentExitsRailView
        key="listing-1"
        exits={[exit]}
        totalCount={1}
        isLoading={false}
        hasError={false}
        restorationState={{ status: "idle" }}
        onRestore={onRestore}
        onResetRestoration={onResetRestoration}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Jonas Brandt wieder aufnehmen" }),
    );
    expect(screen.getByRole("dialog")).not.toBeNull();

    rerender(
      <RecentExitsRailView
        key="listing-2"
        exits={[]}
        totalCount={0}
        isLoading={false}
        hasError={false}
        restorationState={{ status: "idle" }}
        onRestore={onRestore}
        onResetRestoration={onResetRestoration}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("submits the restoration and announces success", async () => {
    const user = userEvent.setup();
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
          }),
        ]}
        totalCount={1}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Jonas Brandt wieder aufnehmen" }),
    );
    await user.click(screen.getByRole("button", { name: "Wieder aufnehmen" }));

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledWith("app-1");
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(
      screen.getByText("Bewerbung wurde wieder aufgenommen."),
    ).not.toBeNull();
  });

  it("keeps the exit and shows a safe error when restoration fails", async () => {
    const user = userEvent.setup();
    const exit = buildExit({
      id: "app-1",
      applicantName: "Jonas Brandt",
      visualState: "provider_discarded",
    });
    onRestore.mockResolvedValue(false);
    const { rerender } = render(
      <RecentExitsRailView
        exits={[exit]}
        totalCount={1}
        isLoading={false}
        hasError={false}
        restorationState={{ status: "idle" }}
        onRestore={onRestore}
        onResetRestoration={onResetRestoration}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Jonas Brandt wieder aufnehmen" }),
    );
    await user.click(screen.getByRole("button", { name: "Wieder aufnehmen" }));

    rerender(
      <RecentExitsRailView
        exits={[exit]}
        totalCount={1}
        isLoading={false}
        hasError={false}
        restorationState={{ status: "error", applicationId: "app-1" }}
        onRestore={onRestore}
        onResetRestoration={onResetRestoration}
      />,
    );

    expect(
      await screen.findByText(
        "Die Bewerbung konnte nicht wieder aufgenommen werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Jonas Brandt")).not.toBeNull();
  });
});
