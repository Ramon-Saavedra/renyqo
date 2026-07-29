import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PopoverPanel } from "./PopoverPanel";

function renderPanel() {
  return render(
    <PopoverPanel
      ariaLabel="Test Panel"
      trigger={({ triggerProps, triggerRef }) => (
        <button ref={triggerRef} {...triggerProps}>
          Open
        </button>
      )}
    >
      <div>Panel content</div>
    </PopoverPanel>,
  );
}

describe("PopoverPanel", () => {
  it("renders the trigger and hides the panel initially", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: "Test Panel" })).not.toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not steal focus on initial mount", () => {
    const previousActive = document.activeElement;
    renderPanel();

    expect(document.activeElement).toBe(previousActive);
  });

  it("opens the panel with a focusable dialog on trigger click", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Test Panel" }));

    const dialog = screen.getByRole("dialog", { name: "Test Panel" });
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("tabindex")).toBe("-1");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPanel();

    const trigger = screen.getByRole("button", { name: "Test Panel" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on outside click without stealing focus", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Test Panel" }));
    expect(screen.getByRole("dialog")).not.toBeNull();

    await user.click(document.body);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it("closes via the close callback and restores focus to the trigger", async () => {
    const user = userEvent.setup();

    render(
      <PopoverPanel
        ariaLabel="Test Panel"
        trigger={({ triggerProps, triggerRef, close }) => (
          <>
            <button ref={triggerRef} {...triggerProps}>
              Open
            </button>
            <button onClick={close}>Close from outside</button>
          </>
        )}
      >
        <div>Panel content</div>
      </PopoverPanel>,
    );

    const trigger = screen.getByRole("button", { name: "Test Panel" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Close from outside" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("toggles the panel on repeated trigger clicks", async () => {
    const user = userEvent.setup();
    renderPanel();

    const trigger = screen.getByRole("button", { name: "Test Panel" });

    await user.click(trigger);
    expect(screen.getByRole("dialog")).not.toBeNull();

    await user.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
