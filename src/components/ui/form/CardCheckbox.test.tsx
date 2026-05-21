import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardCheckbox } from "./CardCheckbox";

describe("CardCheckbox", () => {
  it("reflects the checked prop", () => {
    render(
      <CardCheckbox id="cb" checked={true} onChange={() => {}}>
        Accept
      </CardCheckbox>,
    );

    const input = screen.getByRole("checkbox") as HTMLInputElement;

    expect(input.checked).toBe(true);
  });

  it("toggles via onChange when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CardCheckbox id="cb" checked={false} onChange={onChange}>
        Accept
      </CardCheckbox>,
    );

    await user.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders an optional description", () => {
    render(
      <CardCheckbox
        id="cb"
        checked={false}
        onChange={() => {}}
        description="Extra info"
      >
        Accept
      </CardCheckbox>,
    );

    expect(screen.getByText("Extra info")).toBeInstanceOf(HTMLElement);
  });
});
