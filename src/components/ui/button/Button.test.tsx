import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonClass } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders its children inside a button element", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: "Click me" });

      expect(button).toBeInstanceOf(HTMLButtonElement);
    });

    it('defaults the type attribute to "button"', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole("button", {
        name: "Default",
      }) as HTMLButtonElement;

      expect(button.type).toBe("button");
    });

    it("honors an explicit type attribute", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button", {
        name: "Submit",
      }) as HTMLButtonElement;

      expect(button.type).toBe("submit");
    });
  });

  describe("variants", () => {
    it("applies the primary variant by default", () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole("button", { name: "Primary" });

      expect(button.className).toContain("bg-primary");
      expect(button.className).toContain("text-primary-foreground");
    });

    it("applies the ghost variant when requested", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button", { name: "Ghost" });

      expect(button.className).toContain("bg-transparent");
      expect(button.className).toContain("text-foreground-secondary");
      expect(button.className).not.toContain("bg-primary");
    });

    it("applies the secondary variant when requested", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button", { name: "Secondary" });

      expect(button.className).toContain("bg-primary-tint");
      expect(button.className).toContain("border-primary-soft");
      expect(button.className).toContain("text-primary");
    });
  });

  describe("interaction", () => {
    it("invokes onClick when the user clicks the button", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole("button", { name: "Click" }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not invoke onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );
      const button = screen.getByRole("button", {
        name: "Disabled",
      }) as HTMLButtonElement;

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button.disabled).toBe(true);
    });
  });

  describe("prop forwarding", () => {
    it("appends a custom className to the variant classes", () => {
      render(<Button className="custom-class">Styled</Button>);
      const button = screen.getByRole("button", { name: "Styled" });

      expect(button.className).toContain("custom-class");
      expect(button.className).toContain("bg-primary");
    });

    it("forwards arbitrary HTML attributes to the underlying button", () => {
      render(
        <Button aria-label="Close dialog" data-testid="close-button">
          X
        </Button>,
      );
      const button = screen.getByTestId("close-button");

      expect(button.getAttribute("aria-label")).toBe("Close dialog");
    });
  });
});

describe("buttonClass", () => {
  it("composes the base classes with the requested variant", () => {
    const result = buttonClass("primary");

    expect(result).toContain("inline-flex");
    expect(result).toContain("bg-primary");
  });

  it("appends the extra class fragment when provided", () => {
    const result = buttonClass("ghost", "extra-token");

    expect(result).toContain("bg-transparent");
    expect(result.endsWith("extra-token")).toBe(true);
  });

  it("omits trailing whitespace when no extra classes are provided", () => {
    const result = buttonClass("primary");

    expect(result).toBe(result.trim());
  });
});
