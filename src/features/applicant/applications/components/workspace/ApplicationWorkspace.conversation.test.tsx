import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  loadCompleteConversation,
  markConversationRead,
  sendConversationMessage,
  type ConversationMessage,
} from "../../api/conversation";
import type * as conversationApi from "../../api/conversation";
import type * as documentsApi from "../../api/documents";
import type * as viewingsApi from "../../api/viewings";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
} from "../../api/workspace";
import type * as workspaceApi from "../../api/workspace";
import {
  APPLICATION_ID,
  createWorkspace,
  loadedConversation,
  message,
} from "../../testing/fixtures";
import { ApplicationWorkspace } from "./ApplicationWorkspace";

vi.mock("../../api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof workspaceApi>()),
  getApplicantWorkspace: vi.fn(),
}));

vi.mock("../../api/conversation", async (importOriginal) => ({
  ...(await importOriginal<typeof conversationApi>()),
  loadCompleteConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
  markConversationRead: vi.fn(),
}));

vi.mock("../../api/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof documentsApi>()),
  getDocumentRequestTimelines: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("../../api/viewings", async (importOriginal) => ({
  ...(await importOriginal<typeof viewingsApi>()),
  getViewingDetail: vi.fn(),
}));

vi.mock("../../api/activity", () => ({
  getApplicantActivityPage: vi.fn(),
}));

const getWorkspace = vi.mocked(getApplicantWorkspace);
const loadConversation = vi.mocked(loadCompleteConversation);
const send = vi.mocked(sendConversationMessage);
const markRead = vi.mocked(markConversationRead);
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

function openWorkspace(
  canCurrentUserSend: boolean,
  asOf?: string,
): ApplicantWorkspace {
  return createWorkspace(
    {
      attention: canCurrentUserSend
        ? {
            pendingActions: [
              { type: "RESPOND_TO_MESSAGE", source: "CONVERSATION" },
            ],
            pendingActionCount: 1,
            hasPendingAction: true,
          }
        : {},
      conversationSummary: {
        isOpen: true,
        isReadOnly: false,
        expectedResponder: canCurrentUserSend ? "APPLICANT" : "PROVIDER",
        canCurrentUserSend,
      },
    },
    asOf,
  );
}

const PROVIDER_MESSAGE = message(
  1,
  "PROVIDER",
  "Ab wann wäre ein Einzug möglich?",
);

beforeEach(() => {
  vi.clearAllMocks();
  markRead.mockResolvedValue(1);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
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

describe("ApplicationWorkspace conversation", () => {
  it("clears the controlled draft only after a successful keyboard submission", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation
      .mockResolvedValueOnce(loadedConversation([PROVIDER_MESSAGE]))
      .mockResolvedValue(
        loadedConversation([
          PROVIDER_MESSAGE,
          message(2, "APPLICANT", "Meine Antwort"),
        ]),
      );
    send.mockResolvedValue(message(2, "APPLICANT", "Meine Antwort"));

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Meine Antwort");
    await user.keyboard("{Control>}{Enter}{/Control}");

    await screen.findByText("Meine Antwort");
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(send).toHaveBeenCalledExactlyOnceWith(
      APPLICATION_ID,
      "Meine Antwort",
    );
  });

  it("renders loaded messages as provider and own bubbles", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(
      loadedConversation([
        PROVIDER_MESSAGE,
        message(2, "APPLICANT", "Zum 01.12.", "2026-10-02T08:00:00.000Z"),
      ]),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    const log = await screen.findByRole("log", {
      name: "Nachrichtenverlauf mit dem Anbieter",
    });
    expect(await within(log).findByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(within(log).getByText("Zum 01.12.")).toBeTruthy();
    expect(within(log).getByText("Anbieter")).toBeTruthy();
    expect(within(log).getByText("Du")).toBeTruthy();
    expect(loadConversation).toHaveBeenCalledWith(APPLICATION_ID, {
      signal: expect.any(AbortSignal),
    });
  });

  it("marks read through the latest loaded message", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(
      loadedConversation([
        PROVIDER_MESSAGE,
        message(4, "PROVIDER", "Noch eine Frage"),
      ]),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    await waitFor(() =>
      expect(markRead).toHaveBeenCalledWith(APPLICATION_ID, 4),
    );
  });

  it("keeps the chat usable when marking read fails", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(loadedConversation([PROVIDER_MESSAGE]));
    markRead.mockRejectedValue(new Error("read failed"));

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    expect(
      await screen.findByText(
        "Der Lesestatus konnte nicht aktualisiert werden. Deine Nachrichten bleiben sichtbar.",
      ),
    ).toBeTruthy();
    expect(screen.getByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Antwort an den Anbieter" }),
    ).toBeTruthy();
  });

  it("sends a message once, clears the draft and refreshes the workspace", async () => {
    const user = userEvent.setup();
    let resolveSend: (value: ConversationMessage) => void = () => undefined;
    getWorkspace
      .mockResolvedValueOnce(openWorkspace(true))
      .mockResolvedValueOnce(openWorkspace(false, "2026-10-04T09:25:00.000Z"));
    loadConversation
      .mockResolvedValueOnce(loadedConversation([PROVIDER_MESSAGE]))
      .mockResolvedValue(
        loadedConversation([
          PROVIDER_MESSAGE,
          message(2, "APPLICANT", "Zum 01.12. wäre ideal."),
        ]),
      );
    send.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Zum 01.12. wäre ideal.");
    await user.click(screen.getByRole("button", { name: "Senden" }));

    expect(
      screen.getByRole("button", { name: "Wird gesendet …" }),
    ).toHaveProperty("disabled", true);
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(APPLICATION_ID, "Zum 01.12. wäre ideal.");

    await act(async () => {
      resolveSend(message(2, "APPLICANT", "Zum 01.12. wäre ideal."));
    });

    expect(
      await screen.findByText("Du bist gerade nicht an der Reihe."),
    ).toBeTruthy();
    expect(getWorkspace).toHaveBeenCalledTimes(2);
  });

  it("preserves the draft and shows a safe error when sending fails", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(loadedConversation([PROVIDER_MESSAGE]));
    send.mockRejectedValue(new ApiError(500, "PrismaClientKnownRequestError"));

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Mein Entwurf");
    await user.click(screen.getByRole("button", { name: "Senden" }));

    expect(
      await screen.findByText(
        "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.",
      ),
    ).toBeTruthy();
    expect(composer).toHaveProperty("value", "Mein Entwurf");
    expect(screen.queryByText(/Prisma/)).toBeNull();
  });

  it("offers no composer when the backend does not allow sending", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(false));
    loadConversation.mockResolvedValue(
      loadedConversation([PROVIDER_MESSAGE], {
        canCurrentUserSend: false,
        expectedResponder: "PROVIDER",
      }),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    expect(
      await screen.findByText("Du bist gerade nicht an der Reihe."),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText("Nur lesbar")).toBeNull();
    expect(
      screen.queryByText("Diese Unterhaltung ist abgeschlossen."),
    ).toBeNull();
  });

  it("does not offer to start a conversation the provider has not opened", async () => {
    getWorkspace.mockResolvedValue(createWorkspace());
    loadConversation.mockResolvedValue(
      loadedConversation([], {
        isOpen: false,
        canCurrentUserSend: false,
        expectedResponder: "PROVIDER",
      }),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    expect(
      await screen.findByText(
        "Der Anbieter hat die Unterhaltung noch nicht begonnen.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(loadConversation).toHaveBeenCalledOnce();
  });

  it("uses newer conversation permissions instead of older workspace permissions", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(
      loadedConversation([PROVIDER_MESSAGE], {
        canCurrentUserSend: false,
        expectedResponder: "PROVIDER",
      }),
    );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByText("Du bist gerade nicht an der Reihe.");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText("Antwort erwartet")).toBeNull();
  });

  it("allows a reply when conversation permission changed after the workspace fetch", async () => {
    getWorkspace.mockResolvedValue(
      createWorkspace({
        listing: { status: "ARCHIVED" },
        conversationSummary: {
          isOpen: true,
          isReadOnly: true,
          canCurrentUserSend: false,
          expectedResponder: null,
        },
      }),
    );
    loadConversation.mockResolvedValue(loadedConversation([PROVIDER_MESSAGE]));
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByRole("textbox", { name: "Antwort an den Anbieter" });
    expect(screen.getByText("Antwort erwartet")).toBeTruthy();
    expect(screen.getByRole("textbox")).toHaveProperty("disabled", false);
    expect(screen.queryByText("Nur lesbar")).toBeNull();
    expect(
      screen.queryByText("Diese Unterhaltung ist abgeschlossen."),
    ).toBeNull();
  });

  it("uses newer read-only conversation capabilities over an editable workspace", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(
      loadedConversation([PROVIDER_MESSAGE], {
        isOpen: true,
        canCurrentUserSend: false,
        expectedResponder: null,
      }),
    );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByText("Diese Unterhaltung ist abgeschlossen.");
    expect(screen.getByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(screen.getByText("Nur lesbar")).toBeTruthy();
    expect(screen.queryByText("Antwort erwartet")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["REJECTED", "WITHDRAWN", "ACCEPTED"] as const)(
    "keeps terminal %s history readable without allowing applicant sending",
    async (status) => {
      getWorkspace.mockResolvedValue(
        createWorkspace({
          application: { status },
          conversationSummary: {
            isOpen: true,
            isReadOnly: true,
            canCurrentUserSend: false,
            expectedResponder: null,
          },
          capabilities: { canWithdraw: false },
        }),
      );
      loadConversation.mockResolvedValue(
        loadedConversation([PROVIDER_MESSAGE], {
          isOpen: true,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
      render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
      await screen.findByText(PROVIDER_MESSAGE.body);
      expect(screen.getByText("Nur lesbar")).toBeTruthy();
      expect(
        screen.getByText("Diese Unterhaltung ist abgeschlossen."),
      ).toBeTruthy();
      expect(screen.queryByText("Antwort erwartet")).toBeNull();
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(screen.queryByRole("button", { name: "Senden" })).toBeNull();
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("uses conversation read-only and open changes", async () => {
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation.mockResolvedValue(
      loadedConversation([PROVIDER_MESSAGE], {
        isOpen: false,
        canCurrentUserSend: false,
        expectedResponder: null,
      }),
    );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByText("Diese Unterhaltung ist abgeschlossen.");
    expect(screen.getByText("Nur lesbar")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("conversation revalidation", () => {
  it("preserves an existing draft when refreshed conversation capabilities disable sending", async () => {
    const user = userEvent.setup();
    getWorkspace
      .mockResolvedValueOnce(openWorkspace(true))
      .mockResolvedValueOnce(openWorkspace(true, "2026-10-04T09:25:00.000Z"));
    loadConversation
      .mockResolvedValueOnce(loadedConversation([PROVIDER_MESSAGE]))
      .mockResolvedValueOnce(
        loadedConversation([PROVIDER_MESSAGE], {
          isOpen: true,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Entwurf behalten");
    act(() => window.dispatchEvent(new Event("focus")));
    await screen.findByText("Diese Unterhaltung ist abgeschlossen.");
    expect(screen.getByRole("textbox")).toBe(composer);
    expect(composer).toHaveProperty("value", "Entwurf behalten");
    expect(composer).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Senden" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByText("Nur lesbar")).toBeTruthy();
    expect(screen.getByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(screen.queryByText("Antwort erwartet")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Senden" }));
    fireEvent.keyDown(composer, { key: "Enter", ctrlKey: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps historical messages visible when the workspace transitions to closed", async () => {
    getWorkspace
      .mockResolvedValueOnce(openWorkspace(true))
      .mockResolvedValueOnce(
        createWorkspace(
          {
            conversationSummary: {
              isOpen: false,
              isReadOnly: true,
              expectedResponder: null,
              canCurrentUserSend: false,
            },
          },
          "2026-10-04T09:25:00.000Z",
        ),
      );
    let finishRefresh: (
      value: ReturnType<typeof loadedConversation>,
    ) => void = () => undefined;
    loadConversation
      .mockResolvedValueOnce(loadedConversation([PROVIDER_MESSAGE]))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
      );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByText(PROVIDER_MESSAGE.body);
    await screen.findByRole("textbox", { name: "Antwort an den Anbieter" });
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(loadConversation).toHaveBeenCalledTimes(2));
    expect(screen.getByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    await act(async () => {
      finishRefresh(
        loadedConversation([], {
          isOpen: false,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
    });
    await screen.findByText("Diese Unterhaltung ist abgeschlossen.");
    expect(screen.getByText(PROVIDER_MESSAGE.body)).toBeTruthy();
    expect(screen.getByText("Nur lesbar")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it("preserves a draft and its component during focus revalidation", async () => {
    const user = userEvent.setup();
    getWorkspace
      .mockResolvedValueOnce(openWorkspace(true))
      .mockResolvedValue(openWorkspace(true, "2026-10-04T09:25:00.000Z"));
    loadConversation.mockResolvedValue(loadedConversation([PROVIDER_MESSAGE]));
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Entwurf behalten");
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(getWorkspace).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(loadConversation).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("textbox")).toBe(composer);
    expect(composer).toHaveProperty("value", "Entwurf behalten");
  });

  it("preserves the draft but blocks the old action after a conflict", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(openWorkspace(true));
    loadConversation
      .mockResolvedValueOnce(loadedConversation([PROVIDER_MESSAGE]))
      .mockResolvedValue(
        loadedConversation([PROVIDER_MESSAGE], {
          canCurrentUserSend: false,
          expectedResponder: "PROVIDER",
        }),
      );
    send.mockRejectedValue(new ApiError(409, "internal conflict"));
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const composer = await screen.findByRole("textbox", {
      name: "Antwort an den Anbieter",
    });
    await user.type(composer, "Entwurf behalten");
    await user.click(screen.getByRole("button", { name: "Senden" }));
    await screen.findByText(
      "Die Unterhaltung hat sich geändert. Dein Entwurf bleibt erhalten. Bitte prüfe den aktuellen Stand.",
    );
    expect(composer).toHaveProperty("value", "Entwurf behalten");
    expect(screen.getByRole("button", { name: "Senden" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(getWorkspace).toHaveBeenCalledTimes(2);
  });
});
