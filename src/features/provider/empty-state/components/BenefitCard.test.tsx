import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import { describe, expect, it } from "vitest";

import { BenefitCard } from "./BenefitCard";

describe("BenefitCard", () => {
  it("renders the title", () => {
    render(
      <BenefitCard
        icon={Home}
        title="Weniger E-Mails"
        description="Beschreibung"
      />,
    );

    expect(screen.getByText("Weniger E-Mails")).toBeInstanceOf(HTMLElement);
  });

  it("renders the description", () => {
    render(
      <BenefitCard
        icon={Home}
        title="Titel"
        description="Kürzere Bearbeitungszeit"
      />,
    );

    expect(screen.getByText("Kürzere Bearbeitungszeit")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the icon as an svg element", () => {
    const { container } = render(
      <BenefitCard icon={Home} title="Titel" description="Beschreibung" />,
    );

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });
});
