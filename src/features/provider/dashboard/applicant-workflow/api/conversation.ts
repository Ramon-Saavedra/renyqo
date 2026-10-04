import { z } from "zod";
import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { WorkspaceContractError } from "./workspace";

const senderSchema = z.enum(["PROVIDER", "APPLICANT"]);
const dateTimeSchema = z.string().datetime();

const conversationMessageSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  senderType: senderSchema,
  body: z.string(),
  createdAt: dateTimeSchema,
  readAt: dateTimeSchema.nullable(),
});

const conversationHistorySchema = z.object({
  applicationId: z.string().min(1),
  conversationId: z.string().min(1).nullable(),
  openedAt: dateTimeSchema.nullable(),
  isOpen: z.boolean(),
  canCurrentUserSend: z.boolean(),
  expectedResponder: senderSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
  lastMessage: conversationMessageSchema.nullable(),
  messages: z.array(conversationMessageSchema),
  hasMore: z.boolean(),
  nextAfterSequence: z.number().int().positive().nullable(),
});

const markReadSchema = z.object({
  markedCount: z.number().int().nonnegative(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type ConversationHistory = z.infer<typeof conversationHistorySchema>;

function parseHistory(value: unknown): ConversationHistory {
  const parsed = conversationHistorySchema.safeParse(value);
  if (!parsed.success) throw new WorkspaceContractError();
  return parsed.data;
}

export async function getConversationHistory(
  applicationId: string,
  afterSequence = 0,
  options?: ApiRequestOptions,
): Promise<ConversationHistory> {
  const params = new URLSearchParams({
    afterSequence: String(afterSequence),
    limit: "50",
  });
  const response = await apiGet<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/conversation?${params.toString()}`,
    options,
  );
  const history = parseHistory(response);
  if (history.applicationId !== applicationId) throw new WorkspaceContractError();
  return history;
}

export async function sendConversationMessage(
  applicationId: string,
  body: string,
): Promise<ConversationMessage> {
  const response = await apiPost<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/conversation/messages`,
    { body },
  );
  const parsed = conversationMessageSchema.safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
  return parsed.data;
}

export async function markConversationRead(
  applicationId: string,
  throughSequence: number,
): Promise<number> {
  const response = await apiPatch<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/conversation/read`,
    { throughSequence },
  );
  const parsed = markReadSchema.safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
  return parsed.data.markedCount;
}
