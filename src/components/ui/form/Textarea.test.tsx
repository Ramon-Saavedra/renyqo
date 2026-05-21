import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Notiz" />);

    const ta = screen.getByPlaceholderText("Notiz");

    expect(ta).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("applies the base styling classes", () => {
    const { container } = render(<Textarea placeholder="x" />);
    const ta = container.querySelector("textarea");

    expect(ta?.className).toContain("min-h-24");
    expect(ta?.className).toContain("rounded-md");
    expect(ta?.className).toContain("bg-background-subtle");
  });

  it("calls onChange when the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea placeholder="x" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("x"), "Hallo");

    expect(onChange).toHaveBeenCalled();
  });

  it("appends a custom className", () => {
    const { container } = render(
      <Textarea className="custom-class" placeholder="x" />,
    );
    const ta = container.querySelector("textarea");

    expect(ta?.className).toContain("custom-class");
  });
});
