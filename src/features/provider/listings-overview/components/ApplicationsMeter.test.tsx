import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicationsMeter } from "./ApplicationsMeter";

describe("ApplicationsMeter", () => {
  it("renders the accessible count label", () => {
    render(<ApplicationsMeter active={2} />);

    expect(
      screen.getByRole("img", { name: "2 von 5 aktiven Bewerbungen" }),
    ).toBeInstanceOf(HTMLElement);
  });
});
