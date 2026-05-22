import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SortMenu } from "./SortMenu";

describe("SortMenu", () => {
  it("renders the trigger button with the current sort label", () => {
    render(<SortMenu value="updated" onChange={vi.fn()} />);
    expect(screen.getByText("Zuletzt aktualisiert")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("does not show the menu by default", () => {
    render(<SortMenu value="updated" onChange={vi.fn()} />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the menu when the trigger button is clicked", async () => {
    const user = userEvent.setup();
    render(<SortMenu value="updated" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Sortieren/ }));
    expect(screen.getByRole("menu")).toBeInstanceOf(HTMLElement);
  });

  it("renders all sort options inside the menu", async () => {
    const user = userEvent.setup();
    render(<SortMenu value="updated" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Sortieren/ }));
    expect(
      screen.getByRole("menuitemradio", { name: /Zuletzt aktualisiert/ }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("menuitemradio", { name: /Neueste zuerst/ }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("menuitemradio", { name: /Bewerbungen/ }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("menuitemradio", { name: /Status/ }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("marks the active option as aria-checked='true'", async () => {
    const user = userEvent.setup();
    render(<SortMenu value="created" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Sortieren/ }));
    expect(
      screen
        .getByRole("menuitemradio", { name: /Neueste zuerst/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("calls onChange and closes the menu when an option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortMenu value="updated" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Sortieren/ }));
    await user.click(
      screen.getByRole("menuitemradio", { name: /Bewerbungen/ }),
    );
    expect(onChange).toHaveBeenCalledWith("applications");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<SortMenu value="updated" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Sortieren/ }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
