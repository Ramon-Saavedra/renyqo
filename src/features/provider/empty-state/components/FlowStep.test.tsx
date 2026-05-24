import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FlowStep } from "./FlowStep";

describe("FlowStep", () => {
  it("renders the step number", () => {
    render(<FlowStep index={1} title="Mietobjekt anlegen" isCurrent={false} totalSteps={3} />);

    expect(screen.getByText("1")).toBeInstanceOf(HTMLElement);
  });

  it("renders the step title", () => {
    render(<FlowStep index={1} title="Mietobjekt anlegen" isCurrent={false} totalSteps={3} />);

    expect(screen.getByText("Mietobjekt anlegen")).toBeInstanceOf(HTMLElement);
  });

  it("applies current styles when isCurrent is true", () => {
    const { container } = render(
      <FlowStep index={1} title="Schritt" isCurrent={true} totalSteps={3} />,
    );
    const row = container.querySelector("div");

    expect(row?.className).toContain("border-primary");
  });

  it("applies idle styles when isCurrent is false", () => {
    const { container } = render(
      <FlowStep index={1} title="Schritt" isCurrent={false} totalSteps={3} />,
    );
    const row = container.querySelector("div");

    expect(row?.className).toContain("border-border");
    expect(row?.className).not.toContain("border-primary");
  });

  it("applies the number current style when isCurrent is true", () => {
    const { container } = render(
      <FlowStep index={1} title="Schritt" isCurrent={true} totalSteps={3} />,
    );
    const numSpan = container.querySelector("span[aria-hidden]");

    expect(numSpan?.className).toContain("bg-primary");
  });

  it("applies the number idle style when isCurrent is false", () => {
    const { container } = render(
      <FlowStep index={1} title="Schritt" isCurrent={false} totalSteps={3} />,
    );
    const numSpan = container.querySelector("span[aria-hidden]");

    expect(numSpan?.className).toContain("bg-background-muted");
  });

  it("includes the connector class when not the last step", () => {
    const { container } = render(
      <FlowStep index={1} title="Schritt" isCurrent={false} totalSteps={3} />,
    );
    const row = container.querySelector("div");

    expect(row?.className).toContain("after:absolute");
  });

  it("omits the connector class for the last step", () => {
    const { container } = render(
      <FlowStep index={3} title="Schritt" isCurrent={false} totalSteps={3} />,
    );
    const row = container.querySelector("div");

    expect(row?.className).not.toContain("after:absolute");
  });
});
