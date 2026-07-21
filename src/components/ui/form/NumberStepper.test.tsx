import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumberStepper } from "./NumberStepper";

describe("NumberStepper", () => {
  it("renders the current value", () => {
    render(<NumberStepper value={3} onChange={() => {}} />);

    expect(screen.getByText("3")).toBeInstanceOf(HTMLElement);
  });

  it("increments when + is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper value={2} onChange={onChange} min={0} max={5} />);

    await user.click(screen.getByRole("button", { name: "Wert erhöhen" }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("decrements when − is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberStepper value={2} onChange={onChange} min={0} max={5} />);

    await user.click(screen.getByRole("button", { name: "Wert verringern" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables + at max", () => {
    render(<NumberStepper value={5} onChange={() => {}} min={0} max={5} />);

    const incButton = screen.getByRole("button", {
      name: "Wert erhöhen",
    }) as HTMLButtonElement;

    expect(incButton.disabled).toBe(true);
  });

  it("disables − at min when allowNull is false", () => {
    render(<NumberStepper value={0} onChange={() => {}} min={0} max={5} />);

    const decButton = screen.getByRole("button", {
      name: "Wert verringern",
    }) as HTMLButtonElement;

    expect(decButton.disabled).toBe(true);
  });

  it("transitions value to null at min when allowNull is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberStepper value={0} onChange={onChange} min={0} max={5} allowNull />,
    );

    await user.click(screen.getByRole("button", { name: "Wert verringern" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows the null label when value is null", () => {
    render(
      <NumberStepper
        value={null}
        onChange={() => {}}
        allowNull
        nullLabel="—"
      />,
    );

    expect(screen.getByText("—")).toBeInstanceOf(HTMLElement);
  });

  it("renders a textual null label without digit typography", () => {
    render(
      <NumberStepper
        value={null}
        onChange={() => {}}
        allowNull
        nullLabel="Nicht festgelegt"
      />,
    );

    const label = screen.getByText("Nicht festgelegt");

    expect(label.className).not.toContain("font-mono");
    expect(label.className).not.toContain("tabular-nums");
  });

  it("keeps digit typography for an actual value", () => {
    render(<NumberStepper value={3} onChange={() => {}} allowNull />);

    const value = screen.getByText("3");

    expect(value.className).toContain("font-mono");
    expect(value.className).toContain("tabular-nums");
  });

  it("disables decrement while no value is set", () => {
    render(
      <NumberStepper
        value={null}
        onChange={() => {}}
        min={1}
        allowNull
        nullLabel="Nicht festgelegt"
      />,
    );

    const decrement = screen.getByRole("button", { name: "Wert verringern" });

    expect((decrement as HTMLButtonElement).disabled).toBe(true);
  });

  it("starts at min when + is clicked from null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NumberStepper
        value={null}
        onChange={onChange}
        min={1}
        max={5}
        allowNull
      />,
    );

    await user.click(screen.getByRole("button", { name: "Wert erhöhen" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
