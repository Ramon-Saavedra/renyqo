import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldError } from "./FieldError";

describe("FieldError", () => {
  describe("structure", () => {
    it("renders as a span element", () => {
      const { container } = render(<FieldError message="Fehler" />);

      expect(container.querySelector("span")).toBeInstanceOf(HTMLSpanElement);
    });

    it("has role alert", () => {
      render(<FieldError message="Fehler" />);

      expect(screen.getByRole("alert")).toBeInstanceOf(HTMLElement);
    });

    it("renders the provided message as its text content", () => {
      render(<FieldError message="Bitte gib deinen Namen ein." />);

      expect(screen.getByRole("alert").textContent).toBe(
        "Bitte gib deinen Namen ein.",
      );
    });
  });

  describe("different messages", () => {
    it("renders an email validation message", () => {
      render(
        <FieldError message="Bitte gib eine gültige E-Mail-Adresse ein." />,
      );

      expect(screen.getByRole("alert").textContent).toBe(
        "Bitte gib eine gültige E-Mail-Adresse ein.",
      );
    });

    it("renders a password validation message", () => {
      render(
        <FieldError message="Das Passwort muss mindestens 8 Zeichen lang sein." />,
      );

      expect(screen.getByRole("alert").textContent).toBe(
        "Das Passwort muss mindestens 8 Zeichen lang sein.",
      );
    });
  });
});
