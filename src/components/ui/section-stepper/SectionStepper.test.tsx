import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionStepper } from "./SectionStepper";

const STEPS = [
  { id: "sec-01", label: "Objektdaten" },
  { id: "sec-02", label: "Anforderungen" },
  { id: "sec-03", label: "Abschluss" },
] as const;

describe("SectionStepper", () => {
  it("renders each step label", () => {
    render(
      <SectionStepper steps={STEPS} activeId="sec-01" completedIds={[]} />,
    );

    expect(screen.getByText("Objektdaten")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Anforderungen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Abschluss")).toBeInstanceOf(HTMLElement);
  });

  it("links each step to its anchor", () => {
    const { container } = render(
      <SectionStepper steps={STEPS} activeId="sec-01" completedIds={[]} />,
    );
    const links = container.querySelectorAll("a");

    expect(links[0]?.getAttribute("href")).toBe("#sec-01");
    expect(links[1]?.getAttribute("href")).toBe("#sec-02");
    expect(links[2]?.getAttribute("href")).toBe("#sec-03");
  });

  it("renders padded numbers for non-completed steps", () => {
    render(
      <SectionStepper steps={STEPS} activeId="sec-01" completedIds={[]} />,
    );

    expect(screen.getByText("01")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("02")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("03")).toBeInstanceOf(HTMLElement);
  });

  it("renders a check icon for completed steps", () => {
    const { container } = render(
      <SectionStepper
        steps={STEPS}
        activeId="sec-02"
        completedIds={["sec-01"]}
      />,
    );

    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("01")).toBeNull();
  });

  it("uses a custom aria-label when provided", () => {
    render(
      <SectionStepper
        steps={STEPS}
        activeId="sec-01"
        completedIds={[]}
        ariaLabel="Schritte"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Schritte" })).toBeInstanceOf(
      HTMLElement,
    );
  });
});
