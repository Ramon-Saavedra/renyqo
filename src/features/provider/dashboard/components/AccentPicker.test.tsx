import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccentPicker } from "./AccentPicker";

const onChange = vi.fn();

describe("AccentPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders accent options as radios", () => {
    render(<AccentPicker value="schiefer" onChange={onChange} />);

    expect(
      screen.getByRole("radiogroup", { name: "Akzentfarbe wählen" }),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("radio", { name: "Schiefer" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("radio", { name: "Salbei" })
        .getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("emits selected accent ids", async () => {
    const user = userEvent.setup();
    render(<AccentPicker value="schiefer" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Salbei" }));

    expect(onChange).toHaveBeenCalledWith("salbei");
  });
});
