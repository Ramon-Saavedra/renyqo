"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  loadCompleteConversation,
  markConversationRead,
  sendConversationMessage,
  type ConversationCapabilities,
  type ConversationMessage,
} from "../api/conversation";
import { isCancelledRequest, isStateConflict } from "../api/errors";

export type ConversationLoad =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready" };

export type SendFailure = "invalid" | "conflict" | "failed";

export interface ConversationController {
  readonly load: ConversationLoad;
  readonly messages: readonly ConversationMessage[];
  readonly capabilities: ConversationCapabilities | null;
  readonly sending: boolean;
  readonly sendFailure: SendFailure | null;
  readonly readFailed: boolean;
  readonly send: (body: string) => Promise<boolean>;
  readonly retry: () => void;
}

interface UseConversationOptions {
  readonly applicationId: string;
  readonly snapshotKey: string;
  readonly isOpen: boolean;
  readonly onSent: () => void;
}

function mergeMessages(
  current: readonly ConversationMessage[],
  next: readonly ConversationMessage[],
): readonly ConversationMessage[] {
  const merged = new Map(current.map((message) => [message.id, message]));
  for (const message of next) merged.set(message.id, message);
  return [...merged.values()].sort((a, b) => a.sequence - b.sequence);
}

export function useConversation({
  applicationId,
  snapshotKey,
  isOpen,
  onSent,
}: UseConversationOptions): ConversationController {
  const [load, setLoad] = useState<ConversationLoad>({ status: "loading" });
  const [messages, setMessages] = useState<readonly ConversationMessage[]>([]);
  const [permissions, setPermissions] = useState<{
    readonly snapshotKey: string;
    readonly capabilities: ConversationCapabilities;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendFailure, setSendFailure] = useState<SendFailure | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generationRef = useRef(0);
  const sendingRef = useRef(false);
  const markedThroughRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const confirmedRef = useRef<readonly ConversationMessage[]>([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    loadCompleteConversation(applicationId, { signal: controller.signal })
      .then((loaded) => {
        if (controller.signal.aborted || generationRef.current !== generation)
          return;
        const merged = mergeMessages(loaded.messages, confirmedRef.current);
        confirmedRef.current = confirmedRef.current.filter(
          (message) => !loaded.messages.some((item) => item.id === message.id),
        );
        setMessages((current) => mergeMessages(current, merged));
        setPermissions({ snapshotKey, capabilities: loaded.capabilities });
        setLoad({ status: "ready" });
        const last = loaded.messages.at(-1);
        const unread = loaded.messages.some(
          (message) =>
            message.senderType === "PROVIDER" && message.readAt === null,
        );
        if (!last || !unread || last.sequence <= markedThroughRef.current)
          return;
        markConversationRead(applicationId, last.sequence)
          .then(() => {
            markedThroughRef.current = Math.max(
              markedThroughRef.current,
              last.sequence,
            );
            if (generationRef.current === generation) setReadFailed(false);
          })
          .catch(() => {
            if (generationRef.current !== generation) return;
            setReadFailed(true);
          });
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          generationRef.current !== generation ||
          isCancelledRequest(error)
        )
          return;
        setLoad({ status: "error" });
        setPermissions(null);
      });

    return () => controller.abort();
  }, [applicationId, snapshotKey, isOpen, retryKey]);

  const retry = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    setPermissions(null);
    setLoad({ status: "loading" });
    setRetryKey((key) => key + 1);
  }, []);

  const capabilities =
    permissions?.snapshotKey === snapshotKey ? permissions.capabilities : null;

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      const trimmed = body.trim();
      if (!trimmed || sendingRef.current || !capabilities?.canCurrentUserSend)
        return false;
      sendingRef.current = true;
      setSending(true);
      setSendFailure(null);
      try {
        const message = await sendConversationMessage(applicationId, trimmed);
        if (!mountedRef.current) return true;
        confirmedRef.current = mergeMessages(confirmedRef.current, [message]);
        setMessages((current) => mergeMessages(current, [message]));
        retry();
        onSent();
        return true;
      } catch (error) {
        if (!mountedRef.current) return false;
        if (isStateConflict(error)) {
          setSendFailure("conflict");
          retry();
          onSent();
        } else {
          setSendFailure(
            error instanceof ApiError && error.status === 400
              ? "invalid"
              : "failed",
          );
        }
        return false;
      } finally {
        sendingRef.current = false;
        if (mountedRef.current) setSending(false);
      }
    },
    [applicationId, capabilities, onSent, retry],
  );

  return {
    load:
      load.status === "error" || capabilities ? load : { status: "loading" },
    messages,
    capabilities,
    sending,
    sendFailure,
    readFailed,
    send,
    retry,
  };
}
