import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PasswordField } from "./PasswordField";

const showLabel = "Passwort anzeigen";
const hideLabel = "Passwort verbergen";

describe("PasswordField", () => {
  describe("structure", () => {
    it("renders a labelled input wired to the provided id", () => {
      render(<PasswordField id="pw" label="Passwort" />);
      const input = screen.getByLabelText("Passwort");

      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input.getAttribute("id")).toBe("pw");
    });

    it("renders the visibility toggle button alongside the input", () => {
      render(<PasswordField id="pw" label="Passwort" />);

      expect(screen.getByRole("button", { name: showLabel })).toBeInstanceOf(
        HTMLButtonElement,
      );
    });

    it("gives the input right padding so the toggle does not overlap the text", () => {
      render(<PasswordField id="pw" label="Passwort" />);

      expect(screen.getByLabelText("Passwort").className).toContain("pr-11");
    });

    it("renders the hint when provided", () => {
      render(
        <PasswordField id="pw" label="Passwort" hint="Mindestens 8 Zeichen" />,
      );

      expect(screen.getByText("Mindestens 8 Zeichen")).toBeInstanceOf(
        HTMLElement,
      );
    });
  });

  describe("forwarded props", () => {
    it("forwards name, placeholder, autoComplete, required and minLength to the input", () => {
      render(
        <PasswordField
          id="pw"
          label="Passwort"
          name="password"
          placeholder="Mindestens 8 Zeichen"
          autoComplete="new-password"
          required
          minLength={8}
        />,
      );
      const input = screen.getByLabelText("Passwort");

      expect(input.getAttribute("name")).toBe("password");
      expect(input.getAttribute("placeholder")).toBe("Mindestens 8 Zeichen");
      expect(input.getAttribute("autocomplete")).toBe("new-password");
      expect(input.getAttribute("minlength")).toBe("8");
      expect(input.hasAttribute("required")).toBe(true);
    });
  });

  describe("toggle button defaults", () => {
    it("starts hidden: input is type=password, button is not pressed and uses the show label", () => {
      render(<PasswordField id="pw" label="Passwort" />);
      const input = screen.getByLabelText("Passwort");
      const toggle = screen.getByRole("button", { name: showLabel });

      expect(input.getAttribute("type")).toBe("password");
      expect(toggle.getAttribute("aria-pressed")).toBe("false");
    });

    it("uses type=button on the toggle so it does not submit the surrounding form", () => {
      render(<PasswordField id="pw" label="Passwort" />);

      expect(
        screen.getByRole("button", { name: showLabel }).getAttribute("type"),
      ).toBe("button");
    });
  });

  describe("toggle interaction", () => {
    it("revealing: click flips input to type=text, marks pressed and swaps to the hide label", async () => {
      const user = userEvent.setup();
      render(<PasswordField id="pw" label="Passwort" />);

      await user.click(screen.getByRole("button", { name: showLabel }));

      expect(screen.getByLabelText("Passwort").getAttribute("type")).toBe(
        "text",
      );
      const toggle = screen.getByRole("button", { name: hideLabel });
      expect(toggle.getAttribute("aria-pressed")).toBe("true");
    });

    it("hiding again: a second click restores password and the show label", async () => {
      const user = userEvent.setup();
      render(<PasswordField id="pw" label="Passwort" />);

      await user.click(screen.getByRole("button", { name: showLabel }));
      await user.click(screen.getByRole("button", { name: hideLabel }));

      expect(screen.getByLabelText("Passwort").getAttribute("type")).toBe(
        "password",
      );
      const toggle = screen.getByRole("button", { name: showLabel });
      expect(toggle.getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("custom toggle labels", () => {
    it("uses the provided showLabel as the initial aria-label of the toggle", () => {
      render(
        <PasswordField
          id="pw"
          label="Passwort"
          showLabel="Anzeigen"
          hideLabel="Verbergen"
        />,
      );

      expect(screen.getByRole("button", { name: "Anzeigen" })).toBeInstanceOf(
        HTMLButtonElement,
      );
    });

    it("swaps to the provided hideLabel after revealing the password", async () => {
      const user = userEvent.setup();
      render(
        <PasswordField
          id="pw"
          label="Passwort"
          showLabel="Anzeigen"
          hideLabel="Verbergen"
        />,
      );

      await user.click(screen.getByRole("button", { name: "Anzeigen" }));

      expect(screen.getByRole("button", { name: "Verbergen" })).toBeInstanceOf(
        HTMLButtonElement,
      );
    });
  });

  describe("toggle icon", () => {
    it("renders a decorative eye icon inside the toggle button", () => {
      render(<PasswordField id="pw" label="Passwort" />);
      const toggle = screen.getByRole("button", { name: showLabel });
      const svg = toggle.querySelector("svg");

      expect(svg).toBeInstanceOf(SVGElement);
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
