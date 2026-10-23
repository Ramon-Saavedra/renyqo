"use client";

import { useEffect, useRef } from "react";
import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { useRealtimeConversation } from "@/components/shared/conversation/use-realtime-conversation";
import {
  getConversationPage,
  loadCompleteConversation,
  markConversationRead,
} from "../api/conversation";
import type { ConversationMessage } from "../api/conversation";

interface ApplicantConversationRealtimeOptions {
  readonly applicationId: string;
  readonly getMessages: () => readonly ConversationMessage[];
  readonly applyMessages: (messages: readonly ConversationMessage[]) => void;
  readonly onReadSuccess: () => void;
  readonly onReadFailure: () => void;
}

export function useApplicantConversationRealtime({
  applicationId,
  getMessages,
  applyMessages,
  onReadSuccess,
  onReadFailure,
}: ApplicantConversationRealtimeOptions): void {
  const markedThroughRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useRealtimeConversation({
    applicationId,
    active: true,
    getMessages,
    loadFromStart: async (signal) => {
      const loaded = await loadCompleteConversation(applicationId, { signal });
      return loaded.messages;
    },
    loadPage: async (afterSequence, signal) => {
      const page = await getConversationPage(applicationId, afterSequence, {
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
      void acknowledgeProviderMessages(
        applicationId,
        messages,
        markedThroughRef,
        {
          onSuccess: () => {
            if (mountedRef.current) onReadSuccess();
          },
          onFailure: () => {
            if (mountedRef.current) onReadFailure();
          },
        },
      );
    },
  });
}

async function acknowledgeProviderMessages(
  applicationId: string,
  messages: readonly ConversationMessage[],
  markedThrough: { current: number },
  callbacks: { readonly onSuccess: () => void; readonly onFailure: () => void },
): Promise<void> {
  const last = messages.at(-1);
  const unread = messages.some(
    (message) => message.senderType === "PROVIDER" && message.readAt === null,
  );
  if (!last || !unread || last.sequence <= markedThrough.current) return;
  try {
    await markConversationRead(applicationId, last.sequence);
    markedThrough.current = Math.max(markedThrough.current, last.sequence);
    callbacks.onSuccess();
    invalidateGlobalAttention("applicant");
  } catch {
    callbacks.onFailure();
  }
}
