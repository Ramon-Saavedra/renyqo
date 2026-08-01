import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Button,
  buttonClass,
  buttonClassWithSize,
  type ButtonVariant,
} from "./Button";

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

  it("renders every variant with a semantic class marker", () => {
    const markers: Record<ButtonVariant, string> = {
      primary: "bg-primary",
      secondary: "bg-primary-tint",
      outline: "border-border-strong",
      ghost: "bg-transparent",
      danger: "text-danger",
    };

    for (const variant of Object.keys(markers) as ButtonVariant[]) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole("button", { name: variant });
      expect(button.className).toContain(markers[variant]);
      unmount();
    }
  });

  it("renders icon sizes without text overflow", () => {
    const { unmount } = render(
      <Button size="icon-sm" aria-label="Close">
        ×
      </Button>,
    );
    const sm = screen.getByRole("button", { name: "Close" });
    expect(sm.className).toContain("h-8");
    expect(sm.className).toContain("w-8");
    unmount();

    render(
      <Button size="icon-md" aria-label="Menu">
        ☰
      </Button>,
    );
    const md = screen.getByRole("button", { name: "Menu" });
    expect(md.className).toContain("h-11");
    expect(md.className).toContain("w-11");
  });

  it("renders sm size with compact classes", () => {
    render(<Button size="sm">Compact</Button>);
    const button = screen.getByRole("button", { name: "Compact" });
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("rounded-sm");
    expect(button.className).toContain("text-caption");
  });

  it("defaults to md size when no size is provided", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });
    expect(button.className).toContain("h-11");
  });
});

describe("buttonClass", () => {
  it("returns primary variant with md size by default", () => {
    const result = buttonClass("primary");
    expect(result).toContain("h-11");
    expect(result).toContain("bg-primary");
  });

  it("returns ghost variant with sm size by default for backward compat", () => {
    const result = buttonClass("ghost");
    expect(result).toContain("h-8");
    expect(result).toContain("bg-transparent");
    expect(result).toContain("text-foreground-secondary");
  });

  it("appends extra class string when not a known size", () => {
    const result = buttonClass("ghost", "my-custom extra-classes");
    expect(result).toContain("my-custom extra-classes");
    expect(result).toContain("h-8"); // ghost default sm
  });

  it("keeps extra classes separate from explicit size selection", () => {
    const result = buttonClass("primary", "sm custom-width");
    expect(result).toContain("h-11");
    expect(result).toContain("bg-primary");
    expect(result).toContain("sm custom-width");
  });
});

describe("buttonClassWithSize", () => {
  it("composes variant and size without default fallback", () => {
    const result = buttonClassWithSize("danger", "sm");
    expect(result).toContain("h-8");
    expect(result).toContain("text-danger");
  });

  it("appends extra classes after size", () => {
    const result = buttonClassWithSize("primary", "md", "w-full");
    expect(result).toContain("h-11");
    expect(result).toContain("w-full");
  });
});
