import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormAlert } from "./FormAlert";

describe("FormAlert", () => {
  describe("structure", () => {
    it("renders as a div element", () => {
      const { container } = render(
        <FormAlert variant="error" message="Fehler" />,
      );

      expect(container.querySelector("div")).toBeInstanceOf(HTMLDivElement);
    });

    it("has role alert", () => {
      render(<FormAlert variant="error" message="Fehler" />);

      expect(screen.getByRole("alert")).toBeInstanceOf(HTMLElement);
    });

    it("renders the provided message as its text content", () => {
      render(
        <FormAlert variant="error" message="Ein Fehler ist aufgetreten." />,
      );

      expect(screen.getByRole("alert").textContent).toBe(
        "Ein Fehler ist aufgetreten.",
      );
    });
  });

  describe("variant classes", () => {
    it("applies warning color classes for the error variant", () => {
      const { container } = render(
        <FormAlert variant="error" message="Fehler" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).toContain("text-warning");
      expect(el.className).toContain("bg-warning");
    });

    it("applies success color classes for the success variant", () => {
      const { container } = render(
        <FormAlert variant="success" message="Erfolg" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).toContain("text-success");
      expect(el.className).toContain("bg-success");
    });

    it("does not apply warning classes for the success variant", () => {
      const { container } = render(
        <FormAlert variant="success" message="Erfolg" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).not.toContain("text-warning");
    });

    it("does not apply success classes for the error variant", () => {
      const { container } = render(
        <FormAlert variant="error" message="Fehler" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).not.toContain("text-success");
    });
  });

  describe("className prop", () => {
    it("merges an additional className onto the root element", () => {
      const { container } = render(
        <FormAlert variant="error" message="Fehler" className="mb-4" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).toContain("mb-4");
    });

    it("preserves base classes when a custom className is provided", () => {
      const { container } = render(
        <FormAlert variant="error" message="Fehler" className="mb-4" />,
      );
      const el = container.firstChild as HTMLElement;

      expect(el.className).toContain("rounded-md");
    });
  });
});
