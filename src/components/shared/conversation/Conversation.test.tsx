import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Lock } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Conversation } from "./Conversation";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationMessages } from "./ConversationMessages";
import type { ConversationComposerProps, ConversationEntry } from "./types";

const received: ConversationEntry = {
  kind: "message",
  key: "received-1",
  direction: "received",
  author: "Anbieter",
  time: "09:00",
  iso: "2026-10-05T09:00:00.000Z",
  body: "Wann kannst du einziehen?",
};

const sent: ConversationEntry = {
  kind: "message",
  key: "sent-2",
  direction: "sent",
  author: "Du",
  time: "09:05",
  iso: "2026-10-05T09:05:00.000Z",
  body: "Im November.",
};

function composerProps(): ConversationComposerProps {
  return {
    id: "conversation-draft",
    value: "Mein Entwurf",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    disabled: false,
    sending: false,
    label: "Antwort",
    placeholder: "Deine Nachricht",
    hint: "Strg + Enter zum Senden",
    sendLabel: "Senden",
    sendingLabel: "Wird gesendet …",
    error: null,
  };
}

const messagesProps = {
  emptyLabel: "Noch keine Nachrichten",
  logLabel: "Nachrichtenverlauf",
  loadState: { status: "ready" },
} as const;

const scrollIntoView = vi.fn();
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

beforeEach(() => {
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalScroll) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});

describe("Conversation presentation", () => {
  it("renders caller-provided identity, day separators and timestamps", () => {
    render(
      <Conversation
        {...messagesProps}
        headerLabel="Kontakt"
        entries={[
          { kind: "day", key: "day-1", label: "Heute" },
          received,
          sent,
        ]}
      />,
    );

    const log = screen.getByRole("log", { name: "Nachrichtenverlauf" });
    expect(screen.getByRole("heading", { name: "Kontakt" })).toBeTruthy();
    expect(within(log).getByText("Heute")).toBeTruthy();
    expect(within(log).getByText("Anbieter")).toBeTruthy();
    expect(within(log).getByText("Du")).toBeTruthy();
    expect(within(log).getByText("09:05").getAttribute("datetime")).toBe(
      sent.iso,
    );
  });

  it("renders long unbroken text and markup as literal message content", () => {
    const body = `${"x".repeat(1000)} <script>alert(1)</script>`;
    render(
      <Conversation {...messagesProps} entries={[{ ...received, body }]} />,
    );

    expect(screen.getByText(body).textContent).toBe(body);
    expect(screen.getByRole("log").querySelector("script")).toBeNull();
  });

  it("exposes loading, retry and read-status feedback accessibly", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(
      <Conversation
        {...messagesProps}
        entries={[]}
        loadState={{ status: "loading", label: "Nachrichten werden geladen" }}
      />,
    );
    expect(screen.getByRole("log").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe(
      "Nachrichten werden geladen",
    );

    rerender(
      <Conversation
        {...messagesProps}
        entries={[received]}
        loadState={{
          status: "error",
          label: "Laden fehlgeschlagen",
          retryLabel: "Erneut versuchen",
          onRetry: retry,
        }}
        statusMessage="Lesestatus nicht aktualisiert"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Laden fehlgeschlagen",
    );
    expect(screen.getByText(received.body)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Lesestatus nicht aktualisiert",
    );
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders an empty conversation and a caller-selected notice without a composer", () => {
    render(
      <Conversation
        {...messagesProps}
        entries={[]}
        notice={{
          icon: Lock,
          title: "Nur lesen",
          text: "Diese Unterhaltung ist geschlossen.",
        }}
      />,
    );
    expect(screen.getByText("Noch keine Nachrichten")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Nur lesen");
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("ConversationComposer", () => {
  it("adjusts the measured input height as the controlled draft grows and clears", () => {
    const props = composerProps();
    const { rerender } = render(<ConversationComposer {...props} value="" />);
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    let contentHeight = 96;
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      get: () => contentHeight,
    });
    textarea.style.borderTopWidth = "1px";
    textarea.style.borderBottomWidth = "1px";

    rerender(<ConversationComposer {...props} value="Eine längere Antwort" />);
    expect(textarea.style.height).toBe("98px");
    expect(textarea.rows).toBe(1);
    expect(screen.getByRole("button", { name: "Senden" }).textContent).toBe("");

    contentHeight = 24;
    rerender(<ConversationComposer {...props} value="" />);
    expect(textarea.style.height).toBe("26px");
  });

  it("leaves the controlled draft untouched after submit and an error", async () => {
    const user = userEvent.setup();
    const props = composerProps();
    const { rerender } = render(<ConversationComposer {...props} />);
    await user.click(screen.getByRole("button", { name: "Senden" }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
    expect(props.onChange).not.toHaveBeenCalled();

    rerender(<ConversationComposer {...props} error="Senden fehlgeschlagen" />);
    const textbox = screen.getByRole("textbox", { name: "Antwort" });
    expect(textbox).toHaveProperty("value", "Mein Entwurf");
    expect(textbox.getAttribute("aria-invalid")).toBeNull();
    rerender(<ConversationComposer {...props} error="Text ungültig" invalid />);
    expect(textbox.getAttribute("aria-invalid")).toBe("true");
    expect(textbox.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id,
    );
  });

  it("blocks shortcut and form submission while unavailable or sending", async () => {
    const user = userEvent.setup();
    const props = composerProps();
    const { rerender } = render(<ConversationComposer {...props} disabled />);
    const textbox = screen.getByRole("textbox");
    fireEvent.keyDown(textbox, { key: "Enter", ctrlKey: true });
    const form = textbox.closest("form");
    if (!form) throw new Error("Composer form missing");
    fireEvent.submit(form);
    expect(props.onSubmit).not.toHaveBeenCalled();

    rerender(<ConversationComposer {...props} sending />);
    expect(
      screen.getByRole("button", { name: "Wird gesendet …" }),
    ).toHaveProperty("disabled", true);
    expect(textbox).toHaveProperty("disabled", true);

    rerender(<ConversationComposer {...props} />);
    await user.click(textbox);
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });
});

describe("Conversation scrolling", () => {
  it("follows composer resizing at the bottom and preserves a manually scrolled position", () => {
    let notifyResize: () => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(function (callback: ResizeObserverCallback) {
        const observer: ResizeObserver = {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect,
        };
        notifyResize = () => callback([], observer);
        return observer;
      }),
    );

    const { unmount } = render(
      <ConversationMessages
        {...messagesProps}
        entries={[received]}
        scrollMode="contained"
      />,
    );
    const log = screen.getByRole("log");
    let height = 300;
    Object.defineProperty(log, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(log, "clientHeight", {
      configurable: true,
      get: () => height,
    });
    log.scrollTop = 700;
    fireEvent.scroll(log);

    height = 200;
    act(() => notifyResize());
    expect(log.scrollTop).toBe(1000);

    log.scrollTop = 200;
    fireEvent.scroll(log);
    height = 100;
    act(() => notifyResize());
    expect(log.scrollTop).toBe(200);

    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("reveals the first message sent from an initially empty conversation", () => {
    const { rerender } = render(
      <ConversationMessages {...messagesProps} entries={[]} />,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(<ConversationMessages {...messagesProps} entries={[sent]} />);
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
      block: "nearest",
    });
  });

  it("keeps the latest message visible in a bounded container without interrupting history reading", () => {
    const { rerender } = render(
      <ConversationMessages
        {...messagesProps}
        entries={[]}
        scrollMode="contained"
      />,
    );
    const log = screen.getByRole("log");
    Object.defineProperty(log, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(log, "clientHeight", {
      configurable: true,
      value: 300,
    });

    rerender(
      <ConversationMessages
        {...messagesProps}
        entries={[received]}
        scrollMode="contained"
      />,
    );
    expect(log.scrollTop).toBe(1000);
    log.scrollTop = 200;
    fireEvent.scroll(log);
    rerender(
      <ConversationMessages
        {...messagesProps}
        entries={[received, { ...received, key: "received-2" }]}
        scrollMode="contained"
      />,
    );
    expect(log.scrollTop).toBe(200);

    rerender(
      <ConversationMessages
        {...messagesProps}
        entries={[received, sent]}
        scrollMode="contained"
      />,
    );
    expect(log.scrollTop).toBe(1000);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("avoids page jumps on load and reveals a newly sent message once", () => {
    const { rerender } = render(
      <ConversationMessages {...messagesProps} entries={[received]} />,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
    rerender(
      <ConversationMessages {...messagesProps} entries={[received, sent]} />,
    );
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
      block: "nearest",
    });
    rerender(
      <ConversationMessages
        {...messagesProps}
        entries={[received, sent]}
        statusMessage="Lesestatus nicht aktualisiert"
      />,
    );
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });
});
