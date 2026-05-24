import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FlowStepsCard } from "./FlowStepsCard";
import type { FlowStepCopy } from "../copy/empty-state";

const STEPS: readonly FlowStepCopy[] = [
  {
    index: 1,
    title: "Mietobjekt anlegen",
    preview: { kind: "property-chips", labels: ["Adresse", "Größe"] },
  },
  {
    index: 2,
    title: "Anforderungen festlegen",
    preview: { kind: "criteria-fields" },
  },
  {
    index: 3,
    title: "Bewerbungen erhalten",
    preview: { kind: "result-bars" },
  },
];

describe("FlowStepsCard", () => {
  it("renders the kicker text", () => {
    render(<FlowStepsCard kicker="In wenigen Schritten" steps={STEPS} currentIndex={0} />);

    expect(screen.getByText("In wenigen Schritten")).toBeInstanceOf(HTMLElement);
  });

  it("renders one progress indicator per step", () => {
    const { container } = render(
      <FlowStepsCard kicker="Schritte" steps={STEPS} currentIndex={0} />,
    );

    const indicators = container.querySelectorAll("span.h-0\\.75");

    expect(indicators).toHaveLength(3);
  });

  it("marks the active indicator with bg-primary", () => {
    const { container } = render(
      <FlowStepsCard kicker="Schritte" steps={STEPS} currentIndex={1} />,
    );

    const indicators = Array.from(container.querySelectorAll("span.h-0\\.75"));

    expect(indicators[1]?.className).toContain("bg-primary");
    expect(indicators[0]?.className).toContain("bg-border-strong");
    expect(indicators[2]?.className).toContain("bg-border-strong");
  });

  it("renders all step titles", () => {
    render(<FlowStepsCard kicker="Schritte" steps={STEPS} currentIndex={0} />);

    expect(screen.getByText("Mietobjekt anlegen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Anforderungen festlegen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Bewerbungen erhalten")).toBeInstanceOf(HTMLElement);
  });

  it("marks the current step as active", () => {
    const { container } = render(
      <FlowStepsCard kicker="Schritte" steps={STEPS} currentIndex={0} />,
    );

    const rows = container.querySelectorAll("[class*='border-primary']");

    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
