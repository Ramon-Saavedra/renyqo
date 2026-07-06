import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Segmented } from "./Segmented";

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
] as const;

describe("Segmented", () => {
  it("renders one button per option", () => {
    render(<Segmented value="a" onChange={() => {}} options={OPTIONS} />);

    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("applies active visual classes to the selected option only", () => {
    render(<Segmented value="b" onChange={() => {}} options={OPTIONS} />);

    const beta = screen.getByRole("radio", { name: "Beta" });
    const alpha = screen.getByRole("radio", { name: "Alpha" });

    expect(beta.className).toContain("bg-primary");
    expect(beta.className).toContain("underline");
    expect(alpha.className).not.toContain("bg-primary");
    expect(alpha.className).not.toContain("underline");
  });

  it("marks the active option with aria-checked", () => {
    render(<Segmented value="b" onChange={() => {}} options={OPTIONS} />);

    const beta = screen.getByRole("radio", { name: "Beta" });
    const alpha = screen.getByRole("radio", { name: "Alpha" });

    expect(beta.getAttribute("aria-checked")).toBe("true");
    expect(alpha.getAttribute("aria-checked")).toBe("false");
  });

  it("calls onChange with the option value when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented value="a" onChange={onChange} options={OPTIONS} />);

    await user.click(screen.getByRole("radio", { name: "Gamma" }));

    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("uses an aria-label on the radiogroup when provided", () => {
    render(
      <Segmented
        value="a"
        onChange={() => {}}
        options={OPTIONS}
        ariaLabel="Greek letters"
      />,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Greek letters" }),
    ).toBeInstanceOf(HTMLElement);
  });
});
