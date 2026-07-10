import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingButton } from "./LoadingButton";

describe("LoadingButton", () => {
  it("renders the idle label as the accessible name", () => {
    render(<LoadingButton>Speichern</LoadingButton>);
    const btn = screen.getByRole("button", { name: "Speichern" });
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("swaps to the loading label, disables, and marks busy while loading", () => {
    render(
      <LoadingButton loading loadingLabel="Wird gespeichert">
        Speichern
      </LoadingButton>,
    );

    const btn = screen.getByRole("button", { name: "Wird gespeichert" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.classList.contains("is-loading")).toBe(true);
  });

  it("shows the success label when success is set", () => {
    render(
      <LoadingButton success successLabel="Gespeichert">
        Speichern
      </LoadingButton>,
    );

    expect(
      screen.getByRole("button", { name: "Gespeichert" }),
    ).toBeInstanceOf(HTMLButtonElement);
  });

  it("adds the ghost hook for the ghost variant", () => {
    render(
      <LoadingButton variant="ghost" loading loadingLabel="Lädt">
        Entwurf
      </LoadingButton>,
    );
    expect(
      screen.getByRole("button").classList.contains("is-ghost"),
    ).toBe(true);
  });
});
