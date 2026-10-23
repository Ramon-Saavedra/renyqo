"use client";

import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { useRealtimeConversation } from "@/components/shared/conversation/use-realtime-conversation";
import {
  collectConversationMessages,
  getConversationHistory,
  markConversationRead,
} from "../api/conversation";
import type { ConversationMessage } from "../api/conversation";

interface ProviderConversationRealtimeOptions {
  readonly applicationId: string;
  readonly active: boolean;
  readonly requestRef: { current: number };
  readonly getMessages: () => readonly ConversationMessage[];
  readonly applyMessages: (messages: readonly ConversationMessage[]) => void;
  readonly onError: () => void;
}

export function useProviderConversationRealtime({
  applicationId,
  active,
  requestRef,
  getMessages,
  applyMessages,
  onError,
}: ProviderConversationRealtimeOptions): void {
  useRealtimeConversation({
    applicationId,
    active,
    getMessages,
    claim: () => {
      const request = ++requestRef.current;
      return () => requestRef.current === request;
    },
    loadFromStart: (signal) =>
      collectConversationMessages((afterSequence) =>
        getConversationHistory(applicationId, afterSequence, { signal }),
      ),
    loadPage: async (afterSequence, signal) => {
      const page = await getConversationHistory(applicationId, afterSequence, {
        signal,
      });
      return {
        messages: page.messages,
        hasMore: page.hasMore,
        nextAfterSequence: page.nextAfterSequence,
      };
    },
    applyMessages: (messages) => {
      applyMessages(messages);
      void acknowledgeApplicantMessages(applicationId, messages);
    },
    onError,
  });
}

async function acknowledgeApplicantMessages(
  applicationId: string,
  messages: readonly ConversationMessage[],
): Promise<void> {
  const through = messages
    .filter(
      (message) =>
        message.senderType === "APPLICANT" && message.readAt === null,
    )
    .at(-1)?.sequence;
  if (through === undefined) return;
  try {
    await markConversationRead(applicationId, through);
    invalidateGlobalAttention("provider");
  } catch {
    // Attention stays authoritative when the read request fails.
  }
}
