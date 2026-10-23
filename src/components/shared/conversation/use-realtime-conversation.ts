"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api/client";
import { catchUpMessages } from "./catch-up";
import { registerOpenConversation } from "@/lib/realtime/open-conversations";

interface SequencedId {
  readonly id: string;
  readonly sequence: number;
}

export interface RealtimeConversationPage<T> {
  readonly messages: readonly T[];
  readonly hasMore: boolean;
  readonly nextAfterSequence: number | null;
}

interface RealtimeConversationOptions<T extends SequencedId> {
  readonly applicationId: string;
  readonly active: boolean;
  readonly getMessages: () => readonly T[];
  readonly loadFromStart: (signal: AbortSignal) => Promise<readonly T[]>;
  readonly loadPage: (
    afterSequence: number,
    signal: AbortSignal,
  ) => Promise<RealtimeConversationPage<T>>;
  readonly applyMessages: (messages: readonly T[]) => void;
  readonly claim?: () => () => boolean;
  readonly onError?: () => void;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof ApiError && error.kind === "cancelled") return true;
  return error instanceof Error && error.name === "AbortError";
}

export function useRealtimeConversation<T extends SequencedId>(
  options: RealtimeConversationOptions<T>,
): void {
  const optionsRef = useRef(options);
  const { active, applicationId } = options;

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!active) return;
    let request = 0;
    let controller: AbortController | null = null;

    const unsubscribe = registerOpenConversation(applicationId, () => {
      const current = ++request;
      controller?.abort();
      const nextController = new AbortController();
      controller = nextController;
      const isCurrent = optionsRef.current.claim?.() ?? (() => true);
      const signal = nextController.signal;

      void catchUpMessages(
        optionsRef.current.getMessages(),
        optionsRef.current.loadFromStart,
        optionsRef.current.loadPage,
        signal,
      )
        .then((result) => {
          if (current !== request || signal.aborted || !isCurrent()) return;
          optionsRef.current.applyMessages(result.messages);
        })
        .catch((error: unknown) => {
          if (current !== request || signal.aborted || isAbortError(error)) {
            return;
          }
          if (!isCurrent()) return;
          optionsRef.current.onError?.();
        });
    });

    return () => {
      request += 1;
      controller?.abort();
      unsubscribe();
    };
  }, [active, applicationId]);
}
