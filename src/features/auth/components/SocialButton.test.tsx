import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SocialButton } from "./SocialButton";

describe("SocialButton", () => {
  describe("structure", () => {
    it("renders a button element", () => {
      render(
        <SocialButton icon={<span data-testid="icon" />}>
          Weiter mit Google
        </SocialButton>,
      );

      expect(
        screen.getByRole("button", { name: "Weiter mit Google" }),
      ).toBeInstanceOf(HTMLButtonElement);
    });

    it("renders the children inside the button", () => {
      render(<SocialButton icon={<span />}>Weiter mit Google</SocialButton>);

      expect(screen.getByText("Weiter mit Google")).toBeInstanceOf(HTMLElement);
    });

    it("wraps the icon in an aria-hidden span with shrink-0", () => {
      const { container } = render(
        <SocialButton icon={<span data-testid="icon" />}>
          Weiter mit Google
        </SocialButton>,
      );
      const wrapper = container.querySelector("span[aria-hidden='true']");

      expect(wrapper).toBeInstanceOf(HTMLElement);
      expect(wrapper?.className).toContain("inline-flex");
      expect(wrapper?.className).toContain("shrink-0");
      expect(wrapper?.querySelector("[data-testid='icon']")).toBeInstanceOf(
        HTMLElement,
      );
    });
  });

  describe("type prop", () => {
    it("defaults the button type to 'button'", () => {
      render(<SocialButton icon={<span />}>Weiter</SocialButton>);

      expect(screen.getByRole("button").getAttribute("type")).toBe("button");
    });

    it("honors a custom type when provided", () => {
      render(
        <SocialButton icon={<span />} type="submit">
          Weiter
        </SocialButton>,
      );

      expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
    });
  });

  describe("forwarded button props", () => {
    it("forwards aria-label to the button", () => {
      render(
        <SocialButton icon={<span />} aria-label="Weiter mit Google">
          Weiter mit Google
        </SocialButton>,
      );

      expect(
        screen.getByRole("button", { name: "Weiter mit Google" }),
      ).toBeInstanceOf(HTMLButtonElement);
    });

    it("invokes onClick when the user clicks the button", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <SocialButton icon={<span />} onClick={onClick}>
          Weiter
        </SocialButton>,
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("respects the disabled attribute", () => {
      render(
        <SocialButton icon={<span />} disabled>
          Weiter
        </SocialButton>,
      );

      expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
        true,
      );
    });
  });

  describe("class composition", () => {
    it("includes the base classes on the button", () => {
      render(<SocialButton icon={<span />}>Weiter</SocialButton>);
      const button = screen.getByRole("button");

      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("h-11");
      expect(button.className).toContain("w-full");
      expect(button.className).toContain("rounded-md");
    });

    it("appends a custom className to the base classes", () => {
      render(
        <SocialButton icon={<span />} className="mt-2">
          Weiter
        </SocialButton>,
      );
      const button = screen.getByRole("button");

      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("mt-2");
    });

    it("does not leave trailing whitespace when className is omitted", () => {
      render(<SocialButton icon={<span />}>Weiter</SocialButton>);
      const button = screen.getByRole("button");

      expect(button.className).toBe(button.className.trim());
      expect(button.className).not.toMatch(/\s\s/);
    });

    it("does not leave duplicated whitespace when className is provided", () => {
      render(
        <SocialButton icon={<span />} className="mt-2">
          Weiter
        </SocialButton>,
      );
      const button = screen.getByRole("button");

      expect(button.className).toBe(button.className.trim());
      expect(button.className).not.toMatch(/\s\s/);
    });
  });
});
