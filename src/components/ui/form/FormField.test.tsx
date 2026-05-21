import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "./FormField";

describe("FormField", () => {
  describe("label", () => {
    it("renders the label text", () => {
      render(
        <FormField label="Adresse">
          <input />
        </FormField>,
      );

      expect(screen.getByText("Adresse")).toBeInstanceOf(HTMLElement);
    });

    it("uses a native label element when htmlFor is provided", () => {
      const { container } = render(
        <FormField label="Adresse" htmlFor="addr">
          <input id="addr" />
        </FormField>,
      );
      const label = container.querySelector("label");

      expect(label).toBeInstanceOf(HTMLLabelElement);
      expect(label?.getAttribute("for")).toBe("addr");
    });

    it("falls back to a non-label element when htmlFor is omitted", () => {
      const { container } = render(
        <FormField label="Segment">
          <div />
        </FormField>,
      );

      expect(container.querySelector("label")).toBeNull();
    });
  });

  describe("required suffix", () => {
    it("appends the Pflichtfeld suffix when required is true", () => {
      render(
        <FormField label="Adresse" required>
          <input />
        </FormField>,
      );

      expect(screen.getByText(/Pflichtfeld/)).toBeInstanceOf(HTMLElement);
    });

    it("omits the suffix by default", () => {
      render(
        <FormField label="Adresse">
          <input />
        </FormField>,
      );

      expect(screen.queryByText(/Pflichtfeld/)).toBeNull();
    });
  });

  describe("hint", () => {
    it("renders the hint when provided", () => {
      render(
        <FormField
          label="Adresse"
          hint="Optional. Du kannst es später anpassen."
        >
          <input />
        </FormField>,
      );

      expect(
        screen.getByText("Optional. Du kannst es später anpassen."),
      ).toBeInstanceOf(HTMLElement);
    });

    it("omits the hint when not provided", () => {
      const { container } = render(
        <FormField label="Adresse">
          <input />
        </FormField>,
      );

      expect(container.querySelectorAll("p")).toHaveLength(0);
    });
  });

  describe("labelTrailing", () => {
    it("renders content next to the label when provided", () => {
      render(
        <FormField label="Notiz" labelTrailing={<span>10 / 100</span>}>
          <textarea />
        </FormField>,
      );

      expect(screen.getByText("10 / 100")).toBeInstanceOf(HTMLElement);
    });
  });

  describe("children", () => {
    it("renders the control children", () => {
      render(
        <FormField label="Adresse">
          <input data-testid="control" />
        </FormField>,
      );

      expect(screen.getByTestId("control")).toBeInstanceOf(HTMLElement);
    });
  });

  describe("custom className", () => {
    it("appends a custom className to the wrapper", () => {
      const { container } = render(
        <FormField label="Adresse" className="sm:col-span-2">
          <input />
        </FormField>,
      );
      const root = container.firstElementChild;

      expect(root?.className).toContain("sm:col-span-2");
      expect(root?.className).toContain("min-w-0");
    });
  });
});
