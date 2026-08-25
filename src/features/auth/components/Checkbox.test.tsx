import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  describe("structure", () => {
    it("renders a label wrapping a checkbox input", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);
      const label = container.querySelector("label");
      const input = label?.querySelector("input");

      expect(label).toBeInstanceOf(HTMLLabelElement);
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input?.getAttribute("type")).toBe("checkbox");
    });

    it("renders the children next to the checkbox, not inside the control label", () => {
      const { container } = render(
        <Checkbox id="terms">Ich akzeptiere die AGB</Checkbox>,
      );
      const controlLabel = container.querySelector("label");

      expect(screen.getByText("Ich akzeptiere die AGB")).toBeInstanceOf(
        HTMLElement,
      );
      expect(controlLabel?.contains(screen.getByText("Ich akzeptiere die AGB"))).toBe(
        false,
      );
    });

    it("supports rich children (text plus nested links)", () => {
      render(
        <Checkbox id="terms">
          Ich akzeptiere die <a href="#agb">AGB</a> und die{" "}
          <a href="#privacy">Datenschutzerklärung</a>.
        </Checkbox>,
      );

      expect(screen.getByRole("link", { name: "AGB" })).toBeInstanceOf(
        HTMLAnchorElement,
      );
      expect(
        screen.getByRole("link", { name: "Datenschutzerklärung" }),
      ).toBeInstanceOf(HTMLAnchorElement);
    });

    it("does not toggle when a nested legal link is clicked", async () => {
      const user = userEvent.setup();
      render(
        <Checkbox id="terms">
          Ich akzeptiere die <a href="#agb">AGB</a>.
        </Checkbox>,
      );
      const input = screen.getByLabelText(/ich akzeptiere die/i);

      await user.click(screen.getByRole("link", { name: "AGB" }));

      expect((input as HTMLInputElement).checked).toBe(false);
    });
  });

  describe("label wiring", () => {
    it("wires label htmlFor to the input id", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);

      expect(container.querySelector("label")?.getAttribute("for")).toBe(
        "terms",
      );
      expect(container.querySelector("input")?.getAttribute("id")).toBe(
        "terms",
      );
    });

    it("makes the checkbox accessible by its label text", () => {
      render(<Checkbox id="terms">Akzeptieren</Checkbox>);

      expect(screen.getByLabelText("Akzeptieren")).toBeInstanceOf(
        HTMLInputElement,
      );
    });
  });

  describe("forwarded input props", () => {
    it("forwards name and required to the input", () => {
      render(
        <Checkbox id="terms" name="terms" required>
          Akzeptieren
        </Checkbox>,
      );
      const input = screen.getByLabelText("Akzeptieren");

      expect(input.getAttribute("name")).toBe("terms");
      expect(input.hasAttribute("required")).toBe(true);
    });

    it("respects defaultChecked", () => {
      render(
        <Checkbox id="terms" defaultChecked>
          Akzeptieren
        </Checkbox>,
      );

      expect(
        (screen.getByLabelText("Akzeptieren") as HTMLInputElement).checked,
      ).toBe(true);
    });

    it("invokes onChange when the user toggles the checkbox", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Checkbox id="terms" onChange={onChange}>
          Akzeptieren
        </Checkbox>,
      );

      await user.click(screen.getByLabelText("Akzeptieren"));

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("always renders type=checkbox even when the consumer cannot override it", () => {
      render(<Checkbox id="terms">Akzeptieren</Checkbox>);

      expect(screen.getByLabelText("Akzeptieren").getAttribute("type")).toBe(
        "checkbox",
      );
    });
  });

  describe("decorative check icon", () => {
    it("renders a decorative check svg next to the input", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);
      const svg = container.querySelector("svg");

      expect(svg).toBeInstanceOf(SVGElement);
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    });

    it("hides the check icon container by default and reveals it when checked (peer-checked)", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);
      const iconWrapper = container.querySelector("span[aria-hidden='true']");

      expect(iconWrapper).toBeInstanceOf(HTMLElement);
      expect(iconWrapper?.className).toContain("opacity-0");
      expect(iconWrapper?.className).toContain("peer-checked:opacity-100");
    });
  });

  describe("class composition", () => {
    it("includes base flex classes on the outer wrapper", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);
      const wrapper = container.firstElementChild as HTMLElement;

      expect(wrapper.className).toContain("flex");
      expect(wrapper.className).toContain("items-start");
    });

    it("appends a custom className to the wrapper without dangling whitespace", () => {
      const { container } = render(
        <Checkbox id="terms" className="mt-1.5 mb-4.5">
          Akzeptieren
        </Checkbox>,
      );
      const wrapper = container.firstElementChild as HTMLElement;

      expect(wrapper.className).toContain("flex");
      expect(wrapper.className).toContain("mt-1.5");
      expect(wrapper.className).toContain("mb-4.5");
      expect(wrapper.className).toBe(wrapper.className.trim());
      expect(wrapper.className).not.toMatch(/\s\s/);
    });

    it("does not leave trailing whitespace on the wrapper when className is omitted", () => {
      const { container } = render(<Checkbox id="terms">Akzeptieren</Checkbox>);
      const wrapper = container.firstElementChild as HTMLElement;

      expect(wrapper.className).toBe(wrapper.className.trim());
    });
  });
});
