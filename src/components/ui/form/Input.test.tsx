import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("renders a text input by default", () => {
    render(<Input placeholder="Email" />);

    const input = screen.getByPlaceholderText("Email");

    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  it("forwards arbitrary HTML attributes", () => {
    render(
      <Input
        id="my-input"
        type="email"
        value="hello@example.com"
        onChange={() => {}}
      />,
    );

    const input = document.getElementById("my-input") as HTMLInputElement;

    expect(input.type).toBe("email");
    expect(input.value).toBe("hello@example.com");
  });

  it("applies the base styling classes", () => {
    const { container } = render(<Input placeholder="x" />);
    const input = container.querySelector("input");

    expect(input?.className).toContain("h-11");
    expect(input?.className).toContain("rounded-md");
    expect(input?.className).toContain("bg-input");
  });

  it("appends a custom className", () => {
    const { container } = render(<Input className="pr-22" placeholder="x" />);
    const input = container.querySelector("input");

    expect(input?.className).toContain("pr-22");
    expect(input?.className).toContain("h-11");
  });

  it("invokes onChange when the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="x" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("x"), "a");

    expect(onChange).toHaveBeenCalled();
  });
});
