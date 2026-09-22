import { render, screen } from "@testing-library/react";
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

function buildExit(overrides: Partial<ExitedApplicant> = {}): ExitedApplicant {
  return {
    id: "exit-1",
    listingId: "listing-1",
    applicantName: "Familie Weber",
    initials: "FW",
    household: "2 Personen",
    introduction: null,
    visualState: "withdrawn",
    activeAtLabel: "01.08.2026",
    exitedAtDateLabel: "30.08.2026",
    ...overrides,
  };
}

describe("RecentExitsRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onRestore.mockResolvedValue(true);
  });

  it("does not render an empty rail", () => {
    render(<RecentExitsRail exits={[]} isLoading={false} hasError={false} />);
    expect(
      screen.queryByRole("region", { name: "Kürzlich ausgeschieden" }),
    ).toBeNull();
  });

  it("renders lifecycle dates and withdrawn styling", () => {
    const { container } = render(
      <RecentExitsRail
        exits={[buildExit()]}
        isLoading={false}
        hasError={false}
      />,
    );
    expect(screen.getByText("Familie Weber")).not.toBeNull();
    expect(screen.getByText("Zurückgezogen")).not.toBeNull();
    expect(screen.getByText("01.08.2026").className).toContain("text-success");
    expect(screen.getByText("30.08.2026").className).toContain("text-danger");
    expect(container.querySelector(".bg-exit-withdrawn-bg")).not.toBeNull();
  });

  it("maps provider and system exit states to their labels", () => {
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "exit-2",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
          }),
          buildExit({
            id: "exit-3",
            applicantName: "Marlene Kaufmann",
            visualState: "system_removed",
          }),
        ]}
        isLoading={false}
        hasError={false}
      />,
    );
    expect(screen.getByText("Abgelehnt")).not.toBeNull();
    expect(screen.getByText("Systemseitig entfernt")).not.toBeNull();
  });

  it("shows loading placeholders instead of exit cards", () => {
    const { container } = render(
      <RecentExitsRail exits={[]} isLoading hasError={false} />,
    );
    expect(container.getElementsByClassName("sk")).toHaveLength(5);
  });

  it("shows an error message when loading failed", () => {
    render(<RecentExitsRail exits={[]} isLoading={false} hasError />);
    expect(
      screen.getByText(
        "Kürzlich ausgeschiedene Bewerbungen konnten nicht geladen werden.",
      ),
    ).not.toBeNull();
  });

  it("restores a provider-discarded application after confirmation", async () => {
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
        isLoading={false}
        hasError={false}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Wiederherstellen — Jonas Brandt" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Wieder aufnehmen" }));
    expect(onRestore).toHaveBeenCalledWith("app-1");
  });

  it("opens an applicant preview", async () => {
    const user = userEvent.setup();
    render(
      <RecentExitsRail
        exits={[buildExit()]}
        isLoading={false}
        hasError={false}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Profil ansehen — Familie Weber" }),
    );
    expect(screen.getByRole("dialog")).not.toBeNull();
  });
});
