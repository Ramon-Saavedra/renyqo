import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createListingCopy } from "../copy/create-listing";
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

    const draftLabel = screen.getByText(createListingCopy.topbar.draft);

    expect(draftLabel).toBeInstanceOf(HTMLElement);
    expect(draftLabel.className).toContain("sr-only");
    expect(draftLabel.className).toContain("lg:not-sr-only");
    expect(draftLabel.parentElement?.className).toContain("normal-case");
    expect(draftLabel.parentElement?.className).toContain("tracking-normal");
    expect(screen.queryByText("Automatisch gespeichert")).toBeNull();
    expect(screen.queryByText("Wird gespeichert")).toBeNull();

    const link = screen.getByRole("link", {
      name: createListingCopy.topbar.back,
    });

    expect(link.getAttribute("href")).toBe("/provider/get-started");
  });

  it("renders unsaved changes as a polite warning state", () => {
    renderTopbarActions({ status: "dirty" });

    const statusLabel = screen.getByText(
      createListingCopy.topbar.unsavedChanges,
    );
    const liveRegion = statusLabel.closest("[aria-live='polite']");

    expect(statusLabel.className).toContain("sr-only");
    expect(statusLabel.className).toContain("lg:not-sr-only");
    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.className).toContain("text-warning");
    expect(liveRegion?.className).toContain("normal-case");
    expect(liveRegion?.className).toContain("tracking-normal");
  });

  it("renders saved as a success state", () => {
    renderTopbarActions({ status: "saved" });

    const liveRegion = screen
      .getByText(createListingCopy.topbar.saved)
      .closest("[aria-live='polite']");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.className).toContain("text-success");
  });

  it("renders save failures as an error state", () => {
    renderTopbarActions({ status: "error" });

    const liveRegion = screen
      .getByText(createListingCopy.topbar.saveError)
      .closest("[aria-live='polite']");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.className).toContain("text-danger");
  });

  it("renders undo and redo controls with disabled states", () => {
    renderTopbarActions({ canUndo: false, canRedo: true });

    const undoLabel = screen.getByText(createListingCopy.topbar.undo);
    const redoLabel = screen.getByText(createListingCopy.topbar.redo);
    const undo = screen.getByRole("button", {
      name: createListingCopy.topbar.undo,
    });
    const redo = screen.getByRole("button", {
      name: createListingCopy.topbar.redo,
    });

    expect(undo).toBeInstanceOf(HTMLButtonElement);
    expect(redo).toBeInstanceOf(HTMLButtonElement);
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    expect((redo as HTMLButtonElement).disabled).toBe(false);
    expect(undoLabel.className).toContain("sr-only");
    expect(redoLabel.className).toContain("sr-only");
    expect(undoLabel.className).toContain("lg:not-sr-only");
    expect(redoLabel.className).toContain("lg:not-sr-only");
  });

  it("calls undo and redo handlers when enabled", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    renderTopbarActions({ canUndo: true, canRedo: true, onUndo, onRedo });

    fireEvent.click(
      screen.getByRole("button", { name: createListingCopy.topbar.undo }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: createListingCopy.topbar.redo }),
    );

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });
});
