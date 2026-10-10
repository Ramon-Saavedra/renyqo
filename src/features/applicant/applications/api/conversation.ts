import { z } from "zod";
import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { ApplicantApplicationContractError } from "./errors";
import { conversationSideSchema, dateTimeSchema } from "./shared-schemas";

const CONVERSATION_PAGE_SIZE = 50;
export const MAX_MESSAGE_LENGTH = 4000;

const messageSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  senderType: conversationSideSchema,
  body: z.string(),
  createdAt: dateTimeSchema,
  readAt: dateTimeSchema.nullable(),
});

const conversationPageSchema = z.object({
  applicationId: z.string().min(1),
  isOpen: z.boolean(),
  canCurrentUserSend: z.boolean(),
  expectedResponder: conversationSideSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
  messages: z.array(messageSchema),
  hasMore: z.boolean(),
  nextAfterSequence: z.number().int().positive().nullable(),
});

const markReadSchema = z.object({
  markedCount: z.number().int().nonnegative(),
});

export type ConversationMessage = z.infer<typeof messageSchema>;
export type ConversationPage = z.infer<typeof conversationPageSchema>;
export type ConversationCapabilities = Pick<
  ConversationPage,
  "isOpen" | "canCurrentUserSend" | "expectedResponder"
>;

export interface LoadedConversation {
  readonly messages: readonly ConversationMessage[];
  readonly capabilities: ConversationCapabilities;
}

function conversationPath(applicationId: string): string {
  return `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}/conversation`;
}

async function getConversationPage(
  applicationId: string,
  afterSequence: number,
  options?: ApiRequestOptions,
): Promise<ConversationPage> {
  const params = new URLSearchParams({
    afterSequence: String(afterSequence),
    limit: String(CONVERSATION_PAGE_SIZE),
  });
  const response = await apiGet<unknown>(
    `${conversationPath(applicationId)}?${params.toString()}`,
    options,
  );
  const parsed = conversationPageSchema.safeParse(response);
  if (!parsed.success || parsed.data.applicationId !== applicationId) {
    throw new ApplicantApplicationContractError();
  }
  return parsed.data;
}

function nextAfterSequence(
  afterSequence: number,
  page: Pick<ConversationPage, "hasMore" | "nextAfterSequence">,
): number | null {
  if (!page.hasMore) return null;
  if (
    page.nextAfterSequence === null ||
    page.nextAfterSequence <= afterSequence
  ) {
    throw new ApplicantApplicationContractError();
  }
  return page.nextAfterSequence;
}

export async function loadCompleteConversation(
  applicationId: string,
  options?: ApiRequestOptions,
): Promise<LoadedConversation> {
  const loaded: ConversationMessage[] = [];
  const seen = new Set<string>();
  let afterSequence: number | null = 0;
  let capabilities: ConversationCapabilities | null = null;
  while (afterSequence !== null) {
    const page = await getConversationPage(
      applicationId,
      afterSequence,
      options,
    );
    capabilities = {
      isOpen: page.isOpen,
      canCurrentUserSend: page.canCurrentUserSend,
      expectedResponder: page.expectedResponder,
    };
    for (const message of page.messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      loaded.push(message);
    }
    afterSequence = nextAfterSequence(afterSequence, page);
  }
  if (!capabilities) throw new ApplicantApplicationContractError();
  return {
    messages: loaded.sort((a, b) => a.sequence - b.sequence),
    capabilities,
  };
}

export async function sendConversationMessage(
  applicationId: string,
  body: string,
): Promise<ConversationMessage> {
  const response = await apiPost<unknown>(
    `${conversationPath(applicationId)}/messages`,
    { body },
  );
  const parsed = messageSchema.safeParse(response);
  if (!parsed.success) throw new ApplicantApplicationContractError();
  return parsed.data;
}

export async function markConversationRead(
  applicationId: string,
  throughSequence: number,
): Promise<number> {
  const response = await apiPatch<unknown>(
    `${conversationPath(applicationId)}/read`,
    { throughSequence },
  );
  const parsed = markReadSchema.safeParse(response);
  if (!parsed.success) throw new ApplicantApplicationContractError();
  return parsed.data.markedCount;
}
