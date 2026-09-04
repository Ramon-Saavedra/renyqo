import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccentPicker } from "./AccentPicker";

const onChange = vi.fn();

describe("AccentPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the accent trigger button without showing radios", () => {
    render(<AccentPicker value="schiefer" onChange={onChange} />);

    expect(
      screen.getByRole("button", { name: "Akzentfarbe anpassen" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Akzentfarbe anpassen" }).className,
    ).toContain("bg-transparent");
    expect(
      screen.getByRole("button", { name: "Akzentfarbe anpassen" }).className,
    ).toContain("hover:bg-primary-tint");
    expect(
      screen
        .getByRole("button", { name: "Akzentfarbe anpassen" })
        .getAttribute("title"),
    ).toBe("Akzentfarbe anpassen");
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("opens the accent options as radios", async () => {
    const user = userEvent.setup();
    render(<AccentPicker value="schiefer" onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: "Akzentfarbe anpassen" }),
    );

    expect(
      screen.getByRole("radiogroup", { name: "Akzentfarbe wählen" }),
    ).not.toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(9);
    expect(
      screen
        .getByRole("radio", { name: "Schiefer" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("radio", { name: "Salbeigrün" })
        .getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("emits selected accent ids", async () => {
    const user = userEvent.setup();
    render(<AccentPicker value="schiefer" onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: "Akzentfarbe anpassen" }),
    );
    await user.click(screen.getByRole("radio", { name: "Salbeigrün" }));

    expect(onChange).toHaveBeenCalledWith("salbei");
  });
});
