import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { HeaderNavLinks } from "./HeaderNavLinks";

function renderHeaderNavLinks(
  props?: Partial<ComponentProps<typeof HeaderNavLinks>>,
) {
  const onNavigate = vi.fn<
    (event: MouseEvent<HTMLAnchorElement>, href: string) => void
  >((event) => {
    event.preventDefault();
  });

  render(<HeaderNavLinks onNavigate={onNavigate} {...props} />);

  return { onNavigate };
}

describe("HeaderNavLinks", () => {
  it("renders provider navigation links", () => {
    renderHeaderNavLinks();

    expect(screen.getByRole("link", { name: /Meine Objekte/i })).toBeInstanceOf(
      HTMLAnchorElement,
    );
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInstanceOf(
      HTMLAnchorElement,
    );
  });

  it("delegates navigation clicks to the parent guard", async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderHeaderNavLinks();

    await user.click(screen.getByRole("link", { name: /Meine Objekte/i }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0]?.[1]).toBe("/provider/listings");
  });
});
