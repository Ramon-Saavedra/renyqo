import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "./Field";

describe("Field", () => {
  describe("structure", () => {
    it("renders a label and an input", () => {
      render(<Field id="email" label="E-Mail" />);

      expect(screen.getByLabelText("E-Mail")).toBeInstanceOf(HTMLInputElement);
    });

    it("wires label htmlFor to the input id", () => {
      render(<Field id="email" label="E-Mail" />);
      const input = screen.getByLabelText("E-Mail");

      expect(input.getAttribute("id")).toBe("email");
    });
  });

  describe("forwarded input props", () => {
    it("forwards type, name, placeholder, autoComplete and required to the input", () => {
      render(
        <Field
          id="email"
          label="E-Mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          required
        />,
      );
      const input = screen.getByLabelText("E-Mail");

      expect(input.getAttribute("type")).toBe("email");
      expect(input.getAttribute("name")).toBe("email");
      expect(input.getAttribute("placeholder")).toBe("name@beispiel.de");
      expect(input.getAttribute("autocomplete")).toBe("email");
      expect(input.hasAttribute("required")).toBe(true);
    });
  });

  describe("hint", () => {
    it("renders the hint text when provided", () => {
      render(<Field id="pw" label="Passwort" hint="Mindestens 8 Zeichen" />);

      expect(screen.getByText("Mindestens 8 Zeichen")).toBeInstanceOf(
        HTMLElement,
      );
    });

    it("omits the hint element when hint is not provided", () => {
      const { container } = render(<Field id="email" label="E-Mail" />);

      expect(container.querySelectorAll("span")).toHaveLength(0);
    });
  });

  describe("trailing slot", () => {
    it("renders the trailing node alongside the input inside a relative wrapper", () => {
      const { container } = render(
        <Field
          id="pw"
          label="Passwort"
          trailing={<button data-testid="trail">x</button>}
        />,
      );
      const wrapper = container.querySelector(".relative");

      expect(wrapper).toBeInstanceOf(HTMLElement);
      expect(wrapper?.querySelector("input")).toBeInstanceOf(HTMLInputElement);
      expect(wrapper?.querySelector('[data-testid="trail"]')).toBeInstanceOf(
        HTMLElement,
      );
    });

    it("does not render a relative wrapper when no trailing is provided", () => {
      const { container } = render(<Field id="email" label="E-Mail" />);

      expect(container.querySelector(".relative")).toBeNull();
    });
  });

  describe("class composition", () => {
    it("includes the base grid classes on the root", () => {
      const { container } = render(<Field id="email" label="E-Mail" />);
      const root = container.firstChild as HTMLElement;

      expect(root.className).toContain("grid");
      expect(root.className).toContain("gap-1.5");
    });

    it("appends a custom className to the root without dangling whitespace", () => {
      const { container } = render(
        <Field id="email" label="E-Mail" className="mb-3.5" />,
      );
      const root = container.firstChild as HTMLElement;

      expect(root.className).toContain("grid");
      expect(root.className).toContain("mb-3.5");
      expect(root.className).toBe(root.className.trim());
      expect(root.className).not.toMatch(/\s\s/);
    });

    it("does not leave trailing whitespace on the root when className is omitted", () => {
      const { container } = render(<Field id="email" label="E-Mail" />);
      const root = container.firstChild as HTMLElement;

      expect(root.className).toBe(root.className.trim());
    });

    it("appends inputClassName to the input alongside the base input classes", () => {
      render(<Field id="email" label="E-Mail" inputClassName="pr-11" />);
      const input = screen.getByLabelText("E-Mail");

      expect(input.className).toContain("h-11");
      expect(input.className).toContain("pr-11");
      expect(input.className).toBe(input.className.trim());
      expect(input.className).not.toMatch(/\s\s/);
    });

    it("does not leave trailing whitespace on the input when inputClassName is omitted", () => {
      render(<Field id="email" label="E-Mail" />);
      const input = screen.getByLabelText("E-Mail");

      expect(input.className).toBe(input.className.trim());
    });

    it("applies inputClassName when a trailing node is rendered too", () => {
      render(
        <Field
          id="pw"
          label="Passwort"
          inputClassName="pr-11"
          trailing={<span>x</span>}
        />,
      );
      const input = screen.getByLabelText("Passwort");

      expect(input.className).toContain("h-11");
      expect(input.className).toContain("pr-11");
    });
  });
});
