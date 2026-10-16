import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Select } from "./Select";
import { NumberStepper } from "./NumberStepper";
import { Segmented } from "./Segmented";
import { CardCheckbox } from "./CardCheckbox";

const css = readFileSync(
  resolve(import.meta.dirname, "../../../app/globals.css"),
  "utf8",
);

describe("control consistency", () => {
  it("keeps field focus and the existing halo independent of dashboard accents", () => {
    render(
      <div data-accent="salbei">
        <Input aria-label="Input" />
        <Textarea aria-label="Textarea" />
        <Select aria-label="Select">
          <option>One</option>
        </Select>
      </div>,
    );
    for (const label of ["Input", "Textarea", "Select"]) {
      const classes = screen.getByLabelText(label).classList;
      expect(classes.contains("focus:border-primary-default")).toBe(true);
      expect(classes.contains("focus:border-primary")).toBe(false);
      expect(classes.contains("focus:shadow-focus")).toBe(true);
    }
    expect(css).toMatch(/--primary-default:\s*#536783/);
    expect(css.match(/--focus-ring:.*;/g)).toEqual([
      "--focus-ring: 0 0 0 3px rgb(83 103 131 / 0.18);",
      "--focus-ring: 0 0 0 3px rgb(83 103 131 / 0.25);",
    ]);
    for (const block of css.match(/\[data-accent="[^"]+"\]\s*\{[^}]+\}/g) ??
      []) {
      expect(block).not.toMatch(/--(?:primary-default|focus-ring):/);
    }
  });

  it("disables editing and tab stops without opacity-only styling or active hover", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <>
        <Input aria-label="Input" disabled onChange={change} />
        <Textarea aria-label="Textarea" disabled onChange={change} />
        <Select aria-label="Select" disabled onChange={change}>
          <option value="one">One</option>
          <option value="two">Two</option>
        </Select>
        <button>Next</button>
      </>,
    );
    await user.type(screen.getByLabelText("Input"), "ignored");
    await user.type(screen.getByLabelText("Textarea"), "ignored");
    await user.selectOptions(screen.getByLabelText("Select"), "two");
    expect(change).not.toHaveBeenCalled();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Next" }),
    );
    for (const label of ["Input", "Textarea", "Select"]) {
      const classes = screen.getByLabelText(label).classList;
      for (const name of [
        "disabled:cursor-not-allowed",
        "disabled:text-foreground-tertiary",
        "disabled:bg-background-muted",
        "disabled:border-border-strong",
        "enabled:hover:not-focus:border-foreground-tertiary",
      ])
        expect(classes.contains(name)).toBe(true);
      expect(classes.contains("hover:border-foreground-tertiary")).toBe(false);
      expect(classes.contains("disabled:opacity-50")).toBe(false);
    }
  });

  it("identifies the keyboard-focused stepper and segmented button inside their shells", async () => {
    const user = userEvent.setup();
    render(
      <>
        <NumberStepper value={0} min={0} onChange={() => {}} />
        <Segmented
          value="a"
          options={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Beta" },
          ]}
          onChange={() => {}}
        />
      </>,
    );
    const increment = screen.getByRole("button", { name: "Wert erh\u00f6hen" });
    await user.tab();
    expect(document.activeElement).toBe(increment);
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("radio", { name: "Alpha" }),
    );
    for (const element of [increment, ...screen.getAllByRole("radio")]) {
      expect(
        element.classList.contains(
          element.getAttribute("aria-checked") === "true"
            ? "focus-visible:outline-primary-foreground"
            : "focus-visible:outline-primary-default",
        ),
      ).toBe(true);
      expect(
        element.classList.contains(
          "focus-visible:[box-shadow:inset_var(--focus-ring)]",
        ),
      ).toBe(true);
    }
    const selected = screen.getByRole("radio", { name: "Alpha" });
    expect(selected.classList.contains("bg-primary-default")).toBe(true);
    expect(selected.classList.contains("text-primary-foreground")).toBe(true);
    expect(selected.classList.contains("bg-primary")).toBe(false);
    expect(selected.classList.contains("bg-transparent")).toBe(false);
  });

  it("exposes focus on the visible checkbox and preserves keyboard selection", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <CardCheckbox id="card" checked={false} onChange={change}>
        Choice
      </CardCheckbox>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Choice" });
    await user.tab();
    expect(document.activeElement).toBe(checkbox);
    expect(checkbox.classList.contains("peer")).toBe(true);
    expect(
      checkbox.nextElementSibling?.classList.contains(
        "peer-focus-visible:shadow-focus",
      ),
    ).toBe(true);
    await user.keyboard(" ");
    expect(change).toHaveBeenCalledWith(true);
  });
});
