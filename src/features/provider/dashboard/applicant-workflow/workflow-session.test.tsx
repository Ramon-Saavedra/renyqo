import { useEffect } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActivityPage, type ActivityPage } from "./api/activity";
import {
  getConversationHistory,
  type ConversationHistory,
} from "./api/conversation";
import type * as ConversationApi from "./api/conversation";
import type { ApplicantWorkspace } from "./api/workspace";
import { createApplicantWorkspace } from "./testing/workspace-fixture";
import type { WorkflowListingContext } from "./workflow-model";
import { useWorkflowSession, WorkflowSession } from "./workflow-session";

vi.mock("./api/activity", () => ({ getActivityPage: vi.fn() }));
vi.mock("./api/documents", () => ({
  listDocumentRequests: vi.fn().mockResolvedValue([]),
}));
vi.mock("./api/conversation", async (importOriginal) => {
  const actual = await importOriginal<typeof ConversationApi>();
  return { ...actual, getConversationHistory: vi.fn() };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

const listing: WorkflowListingContext = {
  id: "listing-1",
  title: "Wohnung",
  city: "Berlin",
  coldRent: 900,
  status: "published",
  rooms: "2",
  livingArea: 60,
};
const reloadWorkspace = () => undefined;

function SessionState() {
  const session = useWorkflowSession();
  const { ensureMessages } = session;
  useEffect(() => {
    ensureMessages();
  }, [ensureMessages]);
  return (
    <>
      <output aria-label="messages status">{session.messagesStatus}</output>
      <output aria-label="messages">
        {session.messages.map((message) => message.body).join(",")}
      </output>
      <output aria-label="activity status">{session.activityStatus}</output>
      <output aria-label="activity">
        {session.activityItems.map((item) => item.id).join(",")}
      </output>
      <output aria-label="cursor">{session.activityCursor}</output>
      <button onClick={() => void session.showMoreActivity()}>
        Load activity
      </button>
      <button onClick={session.collapseActivity}>Collapse activity</button>
    </>
  );
}

function Harness({ workspace }: { readonly workspace: ApplicantWorkspace }) {
  return (
    <WorkflowSession
      workspace={workspace}
      listing={listing}
      reloadWorkspace={reloadWorkspace}
    >
      <SessionState />
    </WorkflowSession>
  );
}

function history(body: string): ConversationHistory {
  return {
    applicationId: "application-1",
    conversationId: null,
    openedAt: null,
    isOpen: false,
    canCurrentUserSend: false,
    expectedResponder: null,
    unreadCount: 0,
    lastMessage: null,
    messages: [
      {
        id: body,
        sequence: 1,
        senderType: "PROVIDER",
        body,
        createdAt: "2026-10-04T12:00:00.000Z",
        readAt: null,
      },
    ],
    hasMore: false,
    nextAfterSequence: null,
  };
}

function page(id: string, asOf: string, cursor: string): ActivityPage {
  return {
    asOf,
    items: [
      {
        id,
        type: "APPLICATION_SUBMITTED",
        actorType: "APPLICANT",
        occurredAt: asOf,
        payload: null,
      },
    ],
    pagination: { hasMore: true, limit: 20, nextCursor: cursor },
    totalCount: 2,
  };
}

describe("WorkflowSession snapshot invalidation", () => {
  beforeEach(() => {
    vi.mocked(getConversationHistory)
      .mockReset()
      .mockResolvedValue(history("initial"));
    vi.mocked(getActivityPage).mockReset();
  });

  it("finishes the new messages load and ignores an older pending response", async () => {
    const old = deferred<ConversationHistory>();
    const current = deferred<ConversationHistory>();
    vi.mocked(getConversationHistory)
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    const workspace = createApplicantWorkspace();
    const { rerender } = render(<Harness workspace={workspace} />);
    await waitFor(() =>
      expect(getConversationHistory).toHaveBeenCalledTimes(1),
    );
    rerender(
      <Harness
        workspace={{ ...workspace, asOf: "2026-10-04T12:30:00.000Z" }}
      />,
    );
    await waitFor(() =>
      expect(getConversationHistory).toHaveBeenCalledTimes(2),
    );
    await act(async () => {
      current.resolve(history("current"));
      await current.promise;
    });
    await waitFor(() =>
      expect(screen.getByLabelText("messages status").textContent).toBe(
        "ready",
      ),
    );
    expect(screen.getByLabelText("messages").textContent).toBe("current");
    await act(async () => {
      old.resolve(history("stale"));
      await old.promise;
    });
    expect(screen.getByLabelText("messages").textContent).toBe("current");
    expect(screen.getByLabelText("messages status").textContent).toBe("ready");
  });

  it.each([true, false])(
    "ignores an old activity page after snapshot change when expanded is %s",
    async (expanded) => {
      const workspace = createApplicantWorkspace();
      const nextAsOf = "2026-10-04T12:30:00.000Z";
      const old = deferred<ActivityPage>();
      const current = deferred<ActivityPage>();
      vi.mocked(getActivityPage)
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(current.promise);
      const { rerender } = render(<Harness workspace={workspace} />);
      fireEvent.click(screen.getByRole("button", { name: "Load activity" }));
      if (!expanded)
        fireEvent.click(
          screen.getByRole("button", { name: "Collapse activity" }),
        );
      rerender(<Harness workspace={{ ...workspace, asOf: nextAsOf }} />);
      await act(async () => {
        old.resolve(page("old", workspace.asOf, "old-cursor"));
        await old.promise;
      });
      expect(screen.getByLabelText("activity").textContent).toBe("");
      expect(screen.getByLabelText("cursor").textContent).toBe("");
      expect(screen.getByLabelText("activity status").textContent).toBe(
        expanded ? "loading" : "idle",
      );
      if (!expanded)
        fireEvent.click(screen.getByRole("button", { name: "Load activity" }));
      await waitFor(() => expect(getActivityPage).toHaveBeenCalledTimes(2));
      expect(vi.mocked(getActivityPage).mock.calls[1]).toEqual([
        "application-1",
        null,
      ]);
      await act(async () => {
        current.resolve(page("current", nextAsOf, "current-cursor"));
        await current.promise;
      });
      expect(screen.getByLabelText("activity").textContent).toBe("current");
      expect(screen.getByLabelText("cursor").textContent).toBe(
        "current-cursor",
      );
      expect(screen.getByLabelText("activity status").textContent).toBe(
        "ready",
      );
    },
  );
});
