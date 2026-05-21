import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";
import { InputAffix } from "./InputAffix";

describe("InputAffix", () => {
  it("renders the suffix", () => {
    render(
      <InputAffix suffix="m²">
        <Input placeholder="68" />
      </InputAffix>,
    );

    expect(screen.getByText("m²")).toBeInstanceOf(HTMLElement);
  });

  it("renders the wrapped input", () => {
    render(
      <InputAffix suffix="€">
        <Input placeholder="980" />
      </InputAffix>,
    );

    expect(screen.getByPlaceholderText("980")).toBeInstanceOf(HTMLInputElement);
  });

  it("positions the suffix as a non-interactive overlay", () => {
    const { container } = render(
      <InputAffix suffix="m²">
        <Input placeholder="68" />
      </InputAffix>,
    );
    const suffix = container.querySelector("span");

    expect(suffix?.className).toContain("pointer-events-none");
    expect(suffix?.className).toContain("absolute");
  });
});
