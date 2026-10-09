"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { cn } from "@/lib/utils/cn";
import styles from "./Conversation.module.css";
import type { ConversationMessagesProps } from "./types";

export function ConversationMessages({
  entries,
  loadState,
  emptyLabel,
  logLabel,
  statusMessage,
  scrollMode = "flow",
}: ConversationMessagesProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLLIElement>(null);
  const previousKey = useRef<string | null>(null);
  const initialized = useRef(false);
  const following = useRef(true);
  const latest = entries.findLast((entry) => entry.kind === "message");
  const latestKey = latest?.key ?? null;
  const latestSent = latest?.kind === "message" && latest.direction === "sent";

  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log || scrollMode !== "contained") return;

    const observer = new ResizeObserver(() => {
      if (following.current) log.scrollTop = log.scrollHeight;
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, [scrollMode]);

  useEffect(() => {
    if (loadState.status !== "ready") return;
    const wasInitialized = initialized.current;
    initialized.current = true;
    const previous = previousKey.current;
    previousKey.current = latestKey;
    if (!latestKey || previous === latestKey) return;
    if (scrollMode === "contained" && (following.current || latestSent)) {
      const log = logRef.current;
      if (log) log.scrollTop = log.scrollHeight;
      following.current = true;
    } else if (scrollMode === "flow" && wasInitialized && latestSent) {
      latestRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [latestKey, latestSent, loadState.status, scrollMode]);

  return (
    <div
      ref={logRef}
      role="log"
      aria-label={logLabel}
      aria-relevant="additions text"
      aria-busy={loadState.status === "loading"}
      tabIndex={scrollMode === "contained" ? 0 : undefined}
      onScroll={(event) => {
        const log = event.currentTarget;
        following.current =
          Math.ceil(log.scrollTop) >= log.scrollHeight - log.clientHeight;
      }}
      className={cn(
        "flex min-w-0 flex-col gap-3.5 px-card-x py-parent-y",
        styles.messages,
        scrollMode === "contained" &&
          "scrollbar-slim min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:shadow-focus",
      )}
    >
      {loadState.status === "loading" && entries.length === 0 ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">{loadState.label}</span>
          <RenyqoSkeleton variant="box" className="h-16 w-3/4" />
          <RenyqoSkeleton variant="box" className="h-12 w-2/3 self-end" />
        </div>
      ) : null}
      {loadState.status === "error" ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-body text-foreground-secondary">
            {loadState.label}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={loadState.onRetry}
          >
            {loadState.retryLabel}
          </Button>
        </div>
      ) : null}
      {loadState.status === "ready" && entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-parent-y text-center text-foreground-secondary">
          <AppIcon
            icon={MessagesSquare}
            size={20}
            className="text-foreground-tertiary"
            decorative
          />
          <p className="text-body">{emptyLabel}</p>
        </div>
      ) : null}
      {entries.length > 0 ? (
        <ol className="flex min-w-0 flex-col gap-3">
          {entries.map((entry) =>
            entry.kind === "day" ? (
              <li
                key={entry.key}
                className={cn("self-center text-caption", styles.metadata)}
              >
                {entry.label}
              </li>
            ) : (
              <li
                key={entry.key}
                ref={entry.key === latestKey ? latestRef : undefined}
                className={cn(
                  "flex min-w-0 flex-col gap-1",
                  entry.direction === "sent" ? "items-end" : "items-start",
                )}
              >
                <p
                  className={cn(
                    "max-w-full text-caption wrap-anywhere",
                    styles.metadata,
                  )}
                >
                  <span className="font-medium">{entry.author}</span>
                  {" · "}
                  <time dateTime={entry.iso}>{entry.time}</time>
                </p>
                <p
                  className={cn(
                    "w-fit max-w-11/12 rounded-md px-card-x py-card-y text-body whitespace-pre-wrap wrap-anywhere",
                    entry.direction === "sent"
                      ? styles.sent
                      : cn("border", styles.received),
                  )}
                >
                  {entry.body}
                </p>
              </li>
            ),
          )}
        </ol>
      ) : null}
      {statusMessage ? (
        <p role="status" className="text-caption text-foreground-tertiary">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
