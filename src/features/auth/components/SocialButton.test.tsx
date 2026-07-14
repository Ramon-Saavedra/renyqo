import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SocialButton } from "./SocialButton";

describe("SocialButton", () => {
  it("renders a button with decorative icon content", () => {
    const { container } = render(
      <SocialButton icon={<span data-testid="icon" />}>
        Weiter mit Google
      </SocialButton>,
    );

    expect(
      screen.getByRole("button", { name: "Weiter mit Google" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      container.querySelector("span[aria-hidden='true'] [data-testid='icon']"),
    ).toBeInstanceOf(HTMLElement);
  });

  it("defaults to type button and honors explicit button props", () => {
    render(
      <SocialButton icon={<span />} type="submit" disabled>
        Weiter
      </SocialButton>,
    );

    const button = screen.getByRole("button", { name: "Weiter" });

    expect((button as HTMLButtonElement).type).toBe("submit");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("invokes onClick when selected", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SocialButton icon={<span />} onClick={onClick}>
        Weiter
      </SocialButton>,
    );

    await user.click(screen.getByRole("button", { name: "Weiter" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
