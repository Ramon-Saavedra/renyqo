import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useDialogFocus } from "@/hooks/useDialogFocus";

function FocusHarness({
  removeTrigger = false,
}: {
  readonly removeTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLButtonElement>(null);
  useDialogFocus({
    open,
    dialogRef,
    fallbackRef,
    onClose: () => setOpen(false),
    canClose: !pending,
  });
  return (
    <>
      {open && removeTrigger ? null : (
        <button onClick={() => setOpen(true)}>Open</button>
      )}
      <button ref={fallbackRef}>Fallback</button>
      {open ? (
        <div ref={dialogRef} role="dialog" tabIndex={-1}>
          <button onClick={() => setOpen(false)}>Close</button>
          <button onClick={() => setPending(true)}>Submit</button>
          <button disabled>Disabled</button>
          <fieldset disabled>
            <button>Disabled by fieldset</button>
          </fieldset>
          <div inert>
            <button>Inert</button>
          </div>
          <button tabIndex={-1}>Programmatic only</button>
          <div hidden>
            <button>Hidden</button>
            <div tabIndex={0}>Hidden panel</div>
          </div>
          <div className="hidden-control">
            <button>CSS hidden</button>
          </div>
          <style>{".hidden-control { display: none; }"}</style>
        </div>
      ) : null}
    </>
  );
}

describe("useDialogFocus", () => {
  it("wraps both ways and excludes hidden, inert, disabled and negative-tabindex controls", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const first = screen.getByRole("button", { name: "Close" });
    const last = screen.getByRole("button", { name: "Submit" });
    expect(document.activeElement).toBe(first);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    await user.tab();
    expect(document.activeElement).toBe(first);
    await user.tab();
    expect(document.activeElement).toBe(last);
    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it("restores the trigger on close and prevents Escape while pending", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(document.activeElement).toBe(trigger);
  });

  it("uses the fallback when the trigger no longer exists", async () => {
    const user = userEvent.setup();
    render(<FocusHarness removeTrigger />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Fallback" }),
    );
  });
});
