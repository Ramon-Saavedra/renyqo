import { render, screen } from "@testing-library/react";
import { Lock } from "lucide-react";
import { describe, expect, it } from "vitest";

import { InfoPill } from "./InfoPill";

describe("InfoPill", () => {
  it("renders its children", () => {
    render(<InfoPill>Welcome</InfoPill>);

    expect(screen.getByText("Welcome")).toBeInstanceOf(HTMLElement);
  });

  it("renders optional visual affordances as decorative content", () => {
    const { container } = render(
      <InfoPill icon={Lock} withPip>
        Trust
      </InfoPill>,
    );

    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
    expect(container.querySelector("span[aria-hidden='true']")).toBeInstanceOf(
      HTMLElement,
    );
  });
});
