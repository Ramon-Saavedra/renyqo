"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api/client";
import { getActivityPage, type ActivityPageItem } from "./api/activity";
import {
  getConversationHistory,
  markConversationRead,
  sendConversationMessage,
  type ConversationMessage,
} from "./api/conversation";
import {
  createDocumentRequests,
  listDocumentRequests,
  openDocumentContent,
  requestDocumentReplacement,
  reviewDocument,
  cancelDocumentRequest,
  type DocumentRequestInput,
} from "./api/documents";
import { selectApplicationForRental } from "./api/select-tenant";
import {
  cancelViewing,
  completeViewing,
  markViewingNoShow,
  proposeViewing,
  rescheduleViewing,
} from "./api/viewings";
import { WorkspaceContractError } from "./api/workspace";
import type { ApplicantWorkspace } from "./api/workspace";
import { applicantWorkflowCopy } from "./copy";
import {
  buildApplicantWorkflowModel,
  type ApplicantWorkflowModel,
  type WorkflowListingContext,
} from "./workflow-model";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type ActionResult = "done" | "busy" | "failed";
type ActionArea = "messages" | "documents" | "viewing";

interface WorkflowSessionValue {
  readonly model: ApplicantWorkflowModel;
  readonly messages: readonly ConversationMessage[];
  readonly messagesStatus: LoadStatus;
  readonly sending: boolean;
  readonly acting: boolean;
  readonly actionError: string | null;
  readonly actionArea: ActionArea | null;
  readonly selecting: boolean;
  readonly activityItems: readonly ActivityPageItem[];
  readonly activityCursor: string | null;
  readonly activityStatus: LoadStatus;
  readonly documentRounds: ReadonlyMap<string, number> | null;
  readonly ensureMessages: () => void;
  readonly sendMessage: (body: string) => Promise<ActionResult>;
  readonly requestDocuments: (
    inputs: readonly DocumentRequestInput[],
  ) => Promise<ActionResult>;
  readonly openDocument: (documentId: string) => Promise<ActionResult>;
  readonly review: (documentId: string) => Promise<ActionResult>;
  readonly replaceRequest: (requestId: string) => Promise<ActionResult>;
  readonly cancelling: boolean;
  readonly cancelRequest: (
    requestId: string,
  ) => Promise<"done" | "busy" | "failed">;
  readonly propose: (date: string, time: string) => Promise<ActionResult>;
  readonly reschedule: (date: string, time: string) => Promise<ActionResult>;
  readonly cancelCurrentViewing: () => Promise<ActionResult>;
  readonly completeCurrentViewing: () => Promise<ActionResult>;
  readonly markCurrentNoShow: () => Promise<ActionResult>;
  readonly showMoreActivity: () => Promise<void>;
  readonly confirmSelectTenant: () => Promise<"done" | "busy" | "failed">;
}

const WorkflowSessionContext = createContext<WorkflowSessionValue | null>(null);

export function useOptionalWorkflowSession(): WorkflowSessionValue | null {
  return useContext(WorkflowSessionContext);
}

export function useWorkflowSession(): WorkflowSessionValue {
  const value = useOptionalWorkflowSession();
  if (!value) {
    throw new Error("Workflow session is missing");
  }
  return value;
}

function actionMessage(error: unknown): string {
  if (error instanceof WorkspaceContractError) {
    return applicantWorkflowCopy.contractError;
  }
  if (error instanceof ApiError && error.kind === "network") {
    return applicantWorkflowCopy.loadError;
  }
  return applicantWorkflowCopy.loadError;
}

interface WorkflowSessionProps {
  readonly workspace: ApplicantWorkspace;
  readonly listing: WorkflowListingContext;
  readonly reloadWorkspace: () => void;
  readonly onSelected?: (() => void) | undefined;
  readonly children: ReactNode;
}

export function WorkflowSession({
  workspace,
  listing,
  reloadWorkspace,
  onSelected,
  children,
}: WorkflowSessionProps) {
  const model = useMemo(
    () => buildApplicantWorkflowModel(workspace, listing),
    [workspace, listing],
  );
  const [messages, setMessages] = useState<readonly ConversationMessage[]>([]);
  const [messagesStatus, setMessagesStatus] = useState<LoadStatus>("idle");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionArea, setActionArea] = useState<ActionArea | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activityItems, setActivityItems] = useState<
    readonly ActivityPageItem[]
  >([]);
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [activityStatus, setActivityStatus] = useState<LoadStatus>("idle");
  const [documentRounds, setDocumentRounds] = useState<ReadonlyMap<
    string,
    number
  > | null>(null);
  const messagesRequest = useRef(0);
  const actionLock = useRef(false);
  const proposalKey = useRef<string | null>(null);
  const rescheduleKey = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listDocumentRequests(workspace.application.id)
      .then((requests) => {
        if (cancelled) return;
        setDocumentRounds(
          new Map(requests.map((request) => [request.id, request.round])),
        );
      })
      .catch(() => {
        if (!cancelled) setDocumentRounds(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspace.application.id, workspace.asOf]);

  const ensureMessages = useCallback(() => {
    if (messagesStatus !== "idle") return;
    const request = messagesRequest.current + 1;
    messagesRequest.current = request;
    setMessagesStatus("loading");
    setActionError(null);
    void getConversationHistory(model.applicationId)
      .then(async (loaded) => {
        if (messagesRequest.current !== request) return;
        setMessages(loaded.messages);
        const incoming = loaded.messages.filter(
          (message) => message.senderType === "APPLICANT" && message.readAt === null,
        );
        const through = incoming.at(-1)?.sequence;
        if (through !== undefined) {
          try {
            await markConversationRead(model.applicationId, through);
            reloadWorkspace();
          } catch {
            setMessagesStatus("ready");
            return;
          }
        }
        setMessagesStatus("ready");
      })
      .catch((error: unknown) => {
        if (messagesRequest.current !== request) return;
        setMessagesStatus("error");
        setActionError(actionMessage(error));
      });
  }, [messagesStatus, model.applicationId, reloadWorkspace]);

  const runAction = useCallback(
    async (
      area: ActionArea,
      message: string,
      action: () => Promise<void>,
    ): Promise<ActionResult> => {
      if (actionLock.current) return "busy";
      actionLock.current = true;
      setActing(true);
      setActionError(null);
      setActionArea(area);
      try {
        await action();
        reloadWorkspace();
        setActionArea(null);
        return "done";
      } catch {
        setActionError(message);
        return "failed";
      } finally {
        actionLock.current = false;
        setActing(false);
      }
    },
    [reloadWorkspace],
  );

  const sendMessage = useCallback(
    async (body: string): Promise<ActionResult> => {
      const trimmed = body.trim();
      if (!trimmed || !model.canSend || actionLock.current) return "busy";
      actionLock.current = true;
      setSending(true);
      setActing(true);
      setActionError(null);
      setActionArea("messages");
      try {
        await sendConversationMessage(model.applicationId, trimmed);
        messagesRequest.current += 1;
        setMessagesStatus("idle");
        setActionArea(null);
        reloadWorkspace();
        return "done";
      } catch {
        setActionError(applicantWorkflowCopy.messages.sendError);
        return "failed";
      } finally {
        actionLock.current = false;
        setSending(false);
        setActing(false);
      }
    },
    [model.applicationId, model.canSend, reloadWorkspace],
  );

  const requestDocuments = useCallback(
    async (
      inputs: readonly DocumentRequestInput[],
    ): Promise<ActionResult> => {
      if (inputs.length === 0) return "busy";
      return runAction(
        "documents",
        applicantWorkflowCopy.documents.requestError,
        () => createDocumentRequests(model.applicationId, inputs),
      );
    },
    [model.applicationId, runAction],
  );

  const value = useMemo<WorkflowSessionValue>(
    () => ({
      model,
      messages,
      messagesStatus,
      sending,
      acting,
      actionError,
      actionArea,
      selecting,
      cancelling,
      activityItems,
      activityCursor,
      activityStatus,
      documentRounds,
      ensureMessages,
      sendMessage,
      requestDocuments,
      openDocument: (documentId) =>
        runAction(
          "documents",
          applicantWorkflowCopy.documents.openError,
          () => openDocumentContent(model.applicationId, documentId),
        ),
      review: (documentId) =>
        runAction(
          "documents",
          applicantWorkflowCopy.documents.reviewError,
          () => reviewDocument(model.applicationId, documentId),
        ),
      replaceRequest: (requestId) =>
        runAction(
          "documents",
          applicantWorkflowCopy.documents.replaceError,
          () => requestDocumentReplacement(model.applicationId, requestId),
        ),
      cancelRequest: async (requestId: string) => {
        if (actionLock.current) return "busy";
        actionLock.current = true;
        setCancelling(true);
        setActing(true);
        setActionError(null);
        setActionArea(null);
        try {
          await cancelDocumentRequest(model.applicationId, requestId);
          reloadWorkspace();
          return "done";
        } catch {
          return "failed";
        } finally {
          actionLock.current = false;
          setCancelling(false);
          setActing(false);
        }
      },
      propose: async (date, time) => {
        if (!proposalKey.current) proposalKey.current = crypto.randomUUID();
        const key = proposalKey.current;
        const result = await runAction(
          "viewing",
          applicantWorkflowCopy.viewing.proposeError,
          () => proposeViewing(model.applicationId, { date, time }, key),
        );
        if (result === "done") proposalKey.current = null;
        return result;
      },
      reschedule: async (date, time) => {
        const viewingId = model.viewing?.viewingId;
        if (!viewingId) return "busy";
        if (!rescheduleKey.current) {
          rescheduleKey.current = crypto.randomUUID();
        }
        const key = rescheduleKey.current;
        const result = await runAction(
          "viewing",
          applicantWorkflowCopy.viewing.rescheduleError,
          () =>
            rescheduleViewing(
              model.applicationId,
              viewingId,
              { date, time },
              key,
            ),
        );
        if (result === "done") rescheduleKey.current = null;
        return result;
      },
      cancelCurrentViewing: () => {
        const viewingId = model.viewing?.viewingId;
        if (!viewingId) return Promise.resolve("busy");
        return runAction(
          "viewing",
          applicantWorkflowCopy.viewing.cancelError,
          () => cancelViewing(model.applicationId, viewingId),
        );
      },
      completeCurrentViewing: () => {
        const viewingId = model.viewing?.viewingId;
        if (!viewingId) return Promise.resolve("busy");
        return runAction(
          "viewing",
          applicantWorkflowCopy.viewing.completeError,
          () => completeViewing(model.applicationId, viewingId),
        );
      },
      markCurrentNoShow: () => {
        const viewingId = model.viewing?.viewingId;
        if (!viewingId) return Promise.resolve("busy");
        return runAction(
          "viewing",
          applicantWorkflowCopy.viewing.noShowError,
          () => markViewingNoShow(model.applicationId, viewingId),
        );
      },
      showMoreActivity: async () => {
        if (activityStatus === "loading") return;
        setActivityStatus("loading");
        setActionError(null);
        try {
          const page = await getActivityPage(
            model.applicationId,
            activityItems.length === 0 ? null : activityCursor,
          );
          setActivityItems((current) => {
            const seen = new Set(current.map((item) => item.id));
            return [
              ...current,
              ...page.items.filter((item) => !seen.has(item.id)),
            ];
          });
          setActivityCursor(page.pagination.nextCursor);
          setActivityStatus("ready");
        } catch {
          setActivityStatus("error");
        }
      },
      confirmSelectTenant: async () => {
        if (!model.canSelectForRental || actionLock.current) return "busy";
        actionLock.current = true;
        setSelecting(true);
        setActing(true);
        setActionError(null);
        setActionArea(null);
        try {
          await selectApplicationForRental(
            model.listing.id,
            model.applicationId,
          );
          reloadWorkspace();
          onSelected?.();
          return "done";
        } catch {
          return "failed";
        } finally {
          actionLock.current = false;
          setSelecting(false);
          setActing(false);
        }
      },
    }),
    [
      actionArea,
      actionError,
      acting,
      activityCursor,
      activityItems,
      activityStatus,
      documentRounds,
      ensureMessages,
      messages,
      messagesStatus,
      model,
      onSelected,
      reloadWorkspace,
      requestDocuments,
      runAction,
      cancelling,
      selecting,
      sendMessage,
      sending,
    ],
  );

  return (
    <WorkflowSessionContext.Provider value={value}>
      {children}
    </WorkflowSessionContext.Provider>
  );
}
