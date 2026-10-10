"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import styles from "./Conversation.module.css";
import type { ConversationComposerProps } from "./types";

export function ConversationComposer({
  id,
  value,
  onChange,
  onSubmit,
  disabled,
  sending,
  maxLength,
  label,
  placeholder,
  hint,
  sendLabel,
  sendingLabel,
  error,
  invalid = false,
}: ConversationComposerProps) {
  const hintId = useId();
  const errorId = useId();
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const blocked = disabled || sending;

  useLayoutEffect(() => {
    const inputArea = inputAreaRef.current;
    const textarea = inputArea?.querySelector("textarea");
    if (!inputArea || !textarea) return;

    const resize = () => {
      const computed = getComputedStyle(textarea);
      const borderHeight =
        parseFloat(computed.borderTopWidth) +
        parseFloat(computed.borderBottomWidth);
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
    };

    resize();
    let width = inputArea.clientWidth;
    const observer = new ResizeObserver(() => {
      const nextWidth = inputArea.clientWidth;
      if (nextWidth === width) return;
      width = nextWidth;
      resize();
    });
    observer.observe(inputArea);
    return () => observer.disconnect();
  }, [value]);

  const submit = () => {
    if (!blocked && value.trim()) onSubmit();
  };

  return (
    <form
      aria-busy={sending}
      className={cn(
        "flex min-w-0 shrink-0 flex-col gap-2 border-t border-border px-card-x py-parent-y",
        styles.surface,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div ref={inputAreaRef} className="flex min-w-0 items-end gap-2">
        <Textarea
          id={id}
          rows={1}
          value={value}
          disabled={blocked}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn("scrollbar-slim min-w-0 flex-1", styles.composerInput)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey) &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="submit"
          variant="primary"
          size="icon-md"
          className="shrink-0"
          aria-label={sending ? sendingLabel : sendLabel}
          title={sending ? sendingLabel : sendLabel}
          disabled={blocked || !value.trim()}
        >
          <AppIcon
            icon={sending ? LoaderCircle : Send}
            size={18}
            strokeWidth={2}
            className={sending ? "animate-spin" : ""}
            decorative
          />
        </Button>
      </div>
      <span
        id={hintId}
        className="hidden min-w-0 text-caption wrap-anywhere text-foreground-tertiary lg:block"
      >
        {hint}
      </span>
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-warning">
          {error}
        </p>
      ) : null}
    </form>
  );
}
