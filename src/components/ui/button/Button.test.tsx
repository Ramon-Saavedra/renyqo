import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders children in a button with type button by default", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect((button as HTMLButtonElement).type).toBe("button");
  });

  it("honors explicit button props", () => {
    render(
      <Button type="submit" aria-label="Enviar" className="custom-class">
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Enviar" });

    expect((button as HTMLButtonElement).type).toBe("submit");
    expect(button.className).toContain("custom-class");
  });

  it("invokes onClick only when enabled", async () => {
    const user = userEvent.setup();
    const enabledClick = vi.fn();
    const disabledClick = vi.fn();

    render(
      <>
        <Button onClick={enabledClick}>Enabled</Button>
        <Button onClick={disabledClick} disabled>
          Disabled
        </Button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Enabled" }));
    await user.click(screen.getByRole("button", { name: "Disabled" }));

    expect(enabledClick).toHaveBeenCalledTimes(1);
    expect(disabledClick).not.toHaveBeenCalled();
  });
});
