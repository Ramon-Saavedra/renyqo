import { render, screen } from "@testing-library/react";
import { Home, Star } from "lucide-react";
import { describe, expect, it } from "vitest";

import { BenefitsSection } from "./BenefitsSection";
import type { BenefitCopy } from "../copy/empty-state";

const ITEMS: readonly BenefitCopy[] = [
  { icon: Home, title: "Vorteil A", description: "Beschreibung A" },
  { icon: Star, title: "Vorteil B", description: "Beschreibung B" },
];

describe("BenefitsSection", () => {
  it("renders the section title", () => {
    render(
      <BenefitsSection title="Warum renyqo?" description="Kurze Erklärung" items={ITEMS} />,
    );

    expect(screen.getByText("Warum renyqo?")).toBeInstanceOf(HTMLElement);
  });

  it("renders the section description", () => {
    render(
      <BenefitsSection title="Titel" description="Kurze Erklärung" items={ITEMS} />,
    );

    expect(screen.getByText("Kurze Erklärung")).toBeInstanceOf(HTMLElement);
  });

  it("renders one BenefitCard per item", () => {
    render(
      <BenefitsSection title="Titel" description="Beschreibung" items={ITEMS} />,
    );

    expect(screen.getByText("Vorteil A")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Vorteil B")).toBeInstanceOf(HTMLElement);
  });

  it("appends a custom className alongside the base classes", () => {
    const { container } = render(
      <BenefitsSection
        title="Titel"
        description="Beschreibung"
        items={ITEMS}
        className="pb-10"
      />,
    );
    const section = container.querySelector("section");

    expect(section?.className).toContain("pb-10");
    expect(section?.className).toContain("border-t");
  });
});
