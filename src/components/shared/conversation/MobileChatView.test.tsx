import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileChatView } from "./MobileChatView";

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = "";
});

describe("MobileChatView", () => {
  it("fills the viewport under the topbar and closes in place", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const view = render(
      <MobileChatView
        title="Nachrichten"
        closeLabel="Chat schließen"
        onClose={onClose}
        section="messages"
        accessory={<span>Antworten erlauben</span>}
      >
        <p>Verlauf</p>
      </MobileChatView>,
    );

    const chat = screen.getByRole("region", { name: "Nachrichten" });
    expect(chat.className).toContain("top-app-topbar");
    expect(chat.className).toContain("100dvh");
    expect(chat.className).toContain("var(--safe-area-top)");
    expect(chat.className).not.toContain("pb-safe");
    const safeInset = chat.querySelector(".pb-safe");
    expect(safeInset).toBeInstanceOf(HTMLElement);
    expect(safeInset?.className).toContain("bg-background-muted");
    expect(chat.querySelectorAll(".pb-safe")).toHaveLength(1);
    expect(chat.className).toContain("overflow-hidden");
    expect(chat.getAttribute("data-section")).toBe("messages");
    expect(screen.getByText("Verlauf")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Antworten erlauben")).toBeInstanceOf(HTMLElement);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Chat schließen" }),
    );
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Chat schließen" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(document.documentElement.style.overflow).toBe("");
  });
});
