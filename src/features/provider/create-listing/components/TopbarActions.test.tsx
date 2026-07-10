import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TopbarActions } from "./TopbarActions";

function renderTopbarActions(
  props: Partial<React.ComponentProps<typeof TopbarActions>> = {},
) {
  const defaultProps: React.ComponentProps<typeof TopbarActions> = {
    status: "idle",
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
  };

  return render(<TopbarActions {...defaultProps} {...props} />);
}

describe("TopbarActions", () => {
  it("renders the draft badge and back link without autosave copy", () => {
    renderTopbarActions();

    expect(screen.getByText("Entwurf · Nicht öffentlich")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.queryByText("Automatisch gespeichert")).toBeNull();
    expect(screen.queryByText("Wird gespeichert")).toBeNull();

    const link = screen.getByRole("link", { name: /Zurück/ });

    expect(link.getAttribute("href")).toBe("/provider/get-started");
  });

  it("renders unsaved changes as a polite warning state", () => {
    renderTopbarActions({ status: "dirty" });

    const liveRegion = screen
      .getByText("Ungespeicherte Änderungen")
      .closest("span");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.className).toContain("text-warning");
  });

  it("renders saved as a success state", () => {
    renderTopbarActions({ status: "saved" });

    const liveRegion = screen.getByText("Gespeichert").closest("span");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.className).toContain("text-success");
  });

  it("renders save failures as an error state", () => {
    renderTopbarActions({ status: "error" });

    const liveRegion = screen
      .getByText("Speichern fehlgeschlagen")
      .closest("span");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.className).toContain("text-danger");
  });

  it("renders undo and redo controls with disabled states", () => {
    renderTopbarActions({ canUndo: false, canRedo: true });

    const undo = screen.getByRole("button", { name: "Rückgängig" });
    const redo = screen.getByRole("button", { name: "Wiederholen" });

    expect(undo).toBeInstanceOf(HTMLButtonElement);
    expect(redo).toBeInstanceOf(HTMLButtonElement);
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    expect((redo as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls undo and redo handlers when enabled", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    renderTopbarActions({ canUndo: true, canRedo: true, onUndo, onRedo });

    fireEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    fireEvent.click(screen.getByRole("button", { name: "Wiederholen" }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });
});
