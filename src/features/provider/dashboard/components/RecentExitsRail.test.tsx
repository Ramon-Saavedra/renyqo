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
    canRestore: false,
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
    expect(
      screen.queryByRole("button", { name: "Wiederherstellen — Jonas Brandt" }),
    ).toBeNull();
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

  it("does not offer restore when a withdrawn exit has canRestore false", () => {
    render(
      <RecentExitsRail
        exits={[buildExit()]}
        isLoading={false}
        hasError={false}
      />,
    );
    expect(
      screen.queryByRole("button", {
        name: "Wiederherstellen — Familie Weber",
      }),
    ).toBeNull();
  });

  it("follows canRestore even when the visual state is withdrawn", () => {
    render(
      <RecentExitsRail
        exits={[buildExit({ canRestore: true })]}
        isLoading={false}
        hasError={false}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Wiederherstellen — Familie Weber",
      }),
    ).not.toBeNull();
  });

  it("restores an exit only when canRestore is true", async () => {
    const user = userEvent.setup();
    render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
            canRestore: true,
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

  it("closes the restore dialog when canRestore becomes false before confirmation", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
            canRestore: true,
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

    rerender(
      <RecentExitsRail
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
            canRestore: false,
          }),
        ]}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.queryByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("does not reopen the restore dialog after canRestore flips back to true", async () => {
    const user = userEvent.setup();
    const restorableProps = {
      exits: [
        buildExit({
          id: "app-1",
          applicantName: "Jonas Brandt",
          visualState: "provider_discarded",
          canRestore: true,
        }),
      ],
      isLoading: false,
      hasError: false,
    };
    const { rerender } = render(<RecentExitsRail {...restorableProps} />);
    await user.click(
      screen.getByRole("button", { name: "Wiederherstellen — Jonas Brandt" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).not.toBeNull();

    rerender(
      <RecentExitsRail
        {...restorableProps}
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
            canRestore: false,
          }),
        ]}
      />,
    );
    expect(
      screen.queryByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).toBeNull();

    rerender(<RecentExitsRail {...restorableProps} />);
    expect(
      screen.queryByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("opens a new restore dialog after the prior selection was invalidated", async () => {
    const user = userEvent.setup();
    const restorableProps = {
      exits: [
        buildExit({
          id: "app-1",
          applicantName: "Jonas Brandt",
          visualState: "provider_discarded",
          canRestore: true,
        }),
      ],
      isLoading: false,
      hasError: false,
    };
    const { rerender } = render(<RecentExitsRail {...restorableProps} />);
    await user.click(
      screen.getByRole("button", { name: "Wiederherstellen — Jonas Brandt" }),
    );
    rerender(
      <RecentExitsRail
        {...restorableProps}
        exits={[
          buildExit({
            id: "app-1",
            applicantName: "Jonas Brandt",
            visualState: "provider_discarded",
            canRestore: false,
          }),
        ]}
      />,
    );
    expect(
      screen.queryByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).toBeNull();

    rerender(<RecentExitsRail {...restorableProps} />);
    await user.click(
      screen.getByRole("button", { name: "Wiederherstellen — Jonas Brandt" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Bewerber wieder aufnehmen?" }),
    ).not.toBeNull();
  });

  it("contains preview focus and restores its trigger on Escape", async () => {
    const user = userEvent.setup();
    render(
      <RecentExitsRail
        exits={[buildExit()]}
        isLoading={false}
        hasError={false}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Profil ansehen — Familie Weber",
    });
    await user.click(trigger);
    const close = screen.getByRole("button", { name: "Schließen" });
    expect(document.activeElement).toBe(close);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(close);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
