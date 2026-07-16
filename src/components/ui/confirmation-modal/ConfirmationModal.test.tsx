import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationModal } from "./ConfirmationModal";

const BASE_PROPS = {
  open: true,
  title: "Änderungen verwerfen?",
  text: "Du hast ungespeicherte Änderungen.",
  primaryLabel: "Weiter bearbeiten",
  secondaryLabel: "Ohne Speichern verlassen",
  onPrimary: vi.fn(),
  onSecondary: vi.fn(),
};

function renderModal(
  props?: Partial<ComponentProps<typeof ConfirmationModal>>,
) {
  const onPrimary = vi.fn();
  const onSecondary = vi.fn();
  const onTertiary = vi.fn();

  render(
    <ConfirmationModal
      {...BASE_PROPS}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      {...props}
      onTertiary={props?.onTertiary ?? onTertiary}
    />,
  );

  return { onPrimary, onSecondary, onTertiary };
}

describe("ConfirmationModal", () => {
  it("does not render when closed", () => {
    renderModal({ open: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an accessible dialog with title and text", () => {
    renderModal();

    expect(
      screen.getByRole("dialog", { name: "Änderungen verwerfen?" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Du hast ungespeicherte Änderungen."),
    ).toBeInstanceOf(HTMLElement);
  });

  it("calls primary action from the close icon", async () => {
    const user = userEvent.setup();
    const { onPrimary } = renderModal();
    const [closeButton] = screen.getAllByRole("button", {
      name: "Weiter bearbeiten",
    });

    expect(closeButton).toBeInstanceOf(HTMLButtonElement);
    await user.click(closeButton as HTMLButtonElement);

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("calls primary action when Escape is pressed", () => {
    const { onPrimary } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("calls secondary action from the secondary button", async () => {
    const user = userEvent.setup();
    const { onSecondary } = renderModal();

    await user.click(
      screen.getByRole("button", { name: "Ohne Speichern verlassen" }),
    );

    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("renders and calls the tertiary action when provided", async () => {
    const user = userEvent.setup();
    const { onTertiary } = renderModal({
      tertiaryLabel: "Als Entwurf speichern & verlassen",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Als Entwurf speichern & verlassen",
      }),
    );

    expect(onTertiary).toHaveBeenCalledTimes(1);
  });

  it("shows pending label and disables actions while tertiary action is pending", () => {
    renderModal({
      tertiaryLabel: "Als Entwurf speichern & verlassen",
      tertiaryPendingLabel: "Entwurf wird gespeichert",
      tertiaryPending: true,
    });
    const pendingButton = screen.getByRole("button", {
      name: "Entwurf wird gespeichert",
    });
    const [closeButton] = screen.getAllByRole("button", {
      name: "Weiter bearbeiten",
    });
    const secondaryButton = screen.getByRole("button", {
      name: "Ohne Speichern verlassen",
    });

    expect(pendingButton).toBeInstanceOf(HTMLButtonElement);
    expect(closeButton).toBeInstanceOf(HTMLButtonElement);
    expect(secondaryButton).toBeInstanceOf(HTMLButtonElement);
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
    expect((closeButton as HTMLButtonElement).disabled).toBe(true);
    expect((secondaryButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders an error message when provided", () => {
    renderModal({ error: "Der Entwurf konnte nicht gespeichert werden." });

    expect(
      screen.getByText("Der Entwurf konnte nicht gespeichert werden."),
    ).toBeInstanceOf(HTMLElement);
  });

  it("focuses the first available control when opened", () => {
    renderModal();

    const [closeButton] = screen.getAllByRole("button", {
      name: "Weiter bearbeiten",
    });
    expect(document.activeElement).toBe(closeButton);
  });

  it("restores focus to the previously active element when closed", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    trigger.textContent = "Trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    const onPrimary = vi.fn();
    const props = { ...BASE_PROPS, onPrimary };
    const { rerender } = render(<ConfirmationModal {...props} open />);

    const allPrimary = screen.getAllByRole("button", {
      name: "Weiter bearbeiten",
    });
    await user.click(allPrimary[1]!);

    expect(onPrimary).toHaveBeenCalledTimes(1);
    rerender(<ConfirmationModal {...props} open={false} />);
    expect(trigger).toBe(document.activeElement);
    trigger.remove();
  });

  it("restores focus after a secondary action closes the modal", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    trigger.textContent = "Trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    const onSecondary = vi.fn();
    const props = { ...BASE_PROPS, onSecondary };
    const { rerender } = render(<ConfirmationModal {...props} open />);

    await user.click(
      screen.getByRole("button", { name: "Ohne Speichern verlassen" }),
    );

    expect(onSecondary).toHaveBeenCalledTimes(1);
    rerender(<ConfirmationModal {...props} open={false} />);
    expect(trigger).toBe(document.activeElement);
    trigger.remove();
  });

  it("keeps Tab inside the dialog", () => {
    renderModal();

    const closeButton = screen.getAllByRole("button", {
      name: "Weiter bearbeiten",
    })[0]!;
    const secondaryButton = screen.getByRole("button", {
      name: "Ohne Speichern verlassen",
    });

    secondaryButton.focus();
    expect(document.activeElement).toBe(secondaryButton);

    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(secondaryButton);
  });

  it("keeps focus in the dialog while actions are pending", () => {
    renderModal({
      tertiaryLabel: "Als Entwurf speichern & verlassen",
      tertiaryPendingLabel: "Entwurf wird gespeichert",
      tertiaryPending: true,
    });

    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(dialog);
  });
});
