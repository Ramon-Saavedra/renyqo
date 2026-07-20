import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stepper } from "./Stepper";

const STEPS = ["01 Auswahl", "02 Formular", "03 Abschluss"] as const;

describe("Stepper", () => {
  describe("navigation element", () => {
    it("renders a navigation landmark with the default aria-label", () => {
      render(<Stepper steps={STEPS} currentIndex={0} />);

      expect(
        screen.getByRole("navigation", { name: "Schritte" }),
      ).toBeInstanceOf(HTMLElement);
    });

    it("honors a custom aria-label when provided", () => {
      render(<Stepper steps={STEPS} currentIndex={0} ariaLabel="Onboarding" />);

      expect(
        screen.getByRole("navigation", { name: "Onboarding" }),
      ).toBeInstanceOf(HTMLElement);
    });

    it("appends a custom className to the base classes", () => {
      render(<Stepper steps={STEPS} currentIndex={0} className="mt-10" />);
      const nav = screen.getByRole("navigation", { name: "Schritte" });

      expect(nav.className).toContain("flex");
      expect(nav.className).toContain("mt-10");
    });
  });

  describe("step labels", () => {
    it("renders every provided step in order", () => {
      render(<Stepper steps={STEPS} currentIndex={1} />);
      const nav = screen.getByRole("navigation");

      expect(within(nav).getByText("01 Auswahl")).toBeInstanceOf(HTMLElement);
      expect(within(nav).getByText("02 Formular")).toBeInstanceOf(HTMLElement);
      expect(within(nav).getByText("03 Abschluss")).toBeInstanceOf(HTMLElement);
    });

    it("shows a compact progress summary on mobile", () => {
      render(<Stepper steps={STEPS} currentIndex={1} />);

      expect(screen.getByText("Schritt 2 von 3")).toBeInstanceOf(HTMLElement);
    });
  });

  describe("active step", () => {
    it("marks the step at currentIndex with aria-current=step", () => {
      render(<Stepper steps={STEPS} currentIndex={1} />);
      const active = screen.getByText("02 Formular");

      expect(active.getAttribute("aria-current")).toBe("step");
    });

    it("never marks more than one step as current", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={1} />);

      expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(
        1,
      );
    });

    it("does not mark done steps with aria-current", () => {
      render(<Stepper steps={STEPS} currentIndex={2} />);
      const done = screen.getByText("01 Auswahl");

      expect(done.getAttribute("aria-current")).toBeNull();
    });

    it("does not mark future steps with aria-current", () => {
      render(<Stepper steps={STEPS} currentIndex={0} />);
      const future = screen.getByText("03 Abschluss");

      expect(future.getAttribute("aria-current")).toBeNull();
    });
  });

  describe("done indicator", () => {
    it("renders a check icon for every step before currentIndex", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={2} />);

      expect(container.querySelectorAll("svg")).toHaveLength(2);
    });

    it("renders no check icons when the first step is active", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={0} />);

      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });
  });

  describe("separators", () => {
    it("renders one separator between each pair of steps", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={1} />);
      const separators = container.querySelectorAll(".h-px");

      expect(separators).toHaveLength(STEPS.length - 1);
    });

    it("renders no separator when only one step is provided", () => {
      const { container } = render(
        <Stepper steps={["01 Single"]} currentIndex={0} />,
      );
      const separators = container.querySelectorAll(".h-px");

      expect(separators).toHaveLength(0);
    });
  });

  describe("boundary indices", () => {
    it("first step active: no done indicators are rendered", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={0} />);

      expect(container.querySelectorAll("svg")).toHaveLength(0);
      expect(screen.getByText("01 Auswahl").getAttribute("aria-current")).toBe(
        "step",
      );
    });

    it("last step active: every earlier step renders a done indicator", () => {
      const { container } = render(<Stepper steps={STEPS} currentIndex={2} />);

      expect(container.querySelectorAll("svg")).toHaveLength(2);
      expect(
        screen.getByText("03 Abschluss").getAttribute("aria-current"),
      ).toBe("step");
    });
  });
});
