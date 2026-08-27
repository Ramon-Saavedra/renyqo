import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileActionsBar } from "./ProfileActionsBar";

describe("ProfileActionsBar", () => {
  it("lists every required field and marks the answered ones", () => {
    render(
      <ProfileActionsBar
        missing={["Haushaltsnettoeinkommen", "Raucher?"]}
        complete={false}
        canSave
        saveStatus="idle"
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Für ein vollständiges Profil fehlt noch"),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("button", { name: "Haushaltsnettoeinkommen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("button", { name: "SCHUFA-Auskunft" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("2")).toBeInstanceOf(HTMLElement);
  });

  it("replaces the checklist with a completion line once nothing is missing", () => {
    render(
      <ProfileActionsBar
        missing={[]}
        complete
        canSave
        saveStatus="idle"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Profil vollständig ausgefüllt.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.queryByText("Für ein vollständiges Profil fehlt noch"),
    ).toBeNull();
  });

  it("saves an incomplete but valid profile", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <ProfileActionsBar
        missing={["Raucher?"]}
        complete={false}
        canSave
        saveStatus="idle"
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Profil speichern" }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("blocks saving and explains why when a value is invalid", () => {
    render(
      <ProfileActionsBar
        missing={["Raucher?"]}
        complete={false}
        canSave={false}
        saveStatus="idle"
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Profil speichern" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByText(
        "Bitte prüfe die markierten Angaben, bevor du speicherst.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("announces the saving and saved states", () => {
    const { rerender } = render(
      <ProfileActionsBar
        missing={[]}
        complete
        canSave
        saveStatus="saving"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Speichert")).toBeInstanceOf(HTMLElement);

    rerender(
      <ProfileActionsBar
        missing={[]}
        complete
        canSave
        saveStatus="saved"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Gespeichert")).toBeInstanceOf(HTMLElement);
  });
});
