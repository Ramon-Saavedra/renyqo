import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderNavLinks } from "./HeaderNavLinks";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderHeaderNavLinks(
  props?: Partial<ComponentProps<typeof HeaderNavLinks>>,
) {
  const onSaveBeforeLeave = vi.fn<() => Promise<boolean>>();
  onSaveBeforeLeave.mockResolvedValue(true);

  render(
    <HeaderNavLinks
      hasUnsavedChanges
      canSaveBeforeLeave
      isSavingBeforeLeave={false}
      saveBeforeLeaveError={null}
      onSaveBeforeLeave={onSaveBeforeLeave}
      {...props}
    />,
  );

  return { onSaveBeforeLeave };
}

describe("HeaderNavLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the custom modal instead of native confirm when draft has changes", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");

    renderHeaderNavLinks();

    await user.click(screen.getByRole("link", { name: /Meine Objekte/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Änderungen verwerfen?" }),
    ).toBeInstanceOf(HTMLElement);

    confirmSpy.mockRestore();
  });

  it("closes the modal when the user keeps editing", async () => {
    const user = userEvent.setup();

    renderHeaderNavLinks();

    await user.click(screen.getByRole("link", { name: /Meine Objekte/i }));
    await user.click(screen.getByRole("button", { name: "Weiter bearbeiten" }));

    expect(
      screen.queryByRole("dialog", { name: "Änderungen verwerfen?" }),
    ).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("continues navigation when the user confirms leaving", async () => {
    const user = userEvent.setup();

    renderHeaderNavLinks();

    await user.click(screen.getByRole("link", { name: /Dashboard/i }));
    await user.click(
      screen.getByRole("button", { name: "Ohne Speichern verlassen" }),
    );

    expect(mockPush).toHaveBeenCalledWith("/provider/dashboard");
  });

  it("saves the draft before leaving when the user chooses save and leave", async () => {
    const user = userEvent.setup();
    const { onSaveBeforeLeave } = renderHeaderNavLinks();

    await user.click(screen.getByRole("link", { name: /Dashboard/i }));
    await user.click(
      screen.getByRole("button", {
        name: "Als Entwurf speichern & verlassen",
      }),
    );

    expect(onSaveBeforeLeave).toHaveBeenCalledWith("/provider/dashboard");
  });

  it("shows an error and stays on the page when save before leaving fails", async () => {
    const user = userEvent.setup();
    const onSaveBeforeLeave = vi.fn<() => Promise<boolean>>();
    onSaveBeforeLeave.mockResolvedValue(false);

    renderHeaderNavLinks({
      onSaveBeforeLeave,
      saveBeforeLeaveError: "Fehler beim Speichern",
    });

    await user.click(screen.getByRole("link", { name: /Meine Objekte/i }));
    await user.click(
      screen.getByRole("button", {
        name: "Als Entwurf speichern & verlassen",
      }),
    );

    expect(screen.getByText("Fehler beim Speichern")).toBeInstanceOf(
      HTMLElement,
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("hides save and leave when there is nothing meaningful to save", async () => {
    const user = userEvent.setup();

    renderHeaderNavLinks({ canSaveBeforeLeave: false });

    await user.click(screen.getByRole("link", { name: /Meine Objekte/i }));

    expect(
      screen.queryByRole("button", {
        name: "Als Entwurf speichern & verlassen",
      }),
    ).toBeNull();
  });
});
