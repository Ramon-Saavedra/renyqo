import type { LucideIcon } from "lucide-react";

export type ConversationEntry =
  | { readonly kind: "day"; readonly key: string; readonly label: string }
  | {
      readonly kind: "message";
      readonly key: string;
      readonly direction: "sent" | "received";
      readonly author: string;
      readonly time: string;
      readonly iso: string;
      readonly body: string;
    };

export type ConversationLoadState =
  | { readonly status: "loading"; readonly label: string }
  | { readonly status: "ready" }
  | {
      readonly status: "error";
      readonly label: string;
      readonly retryLabel: string;
      readonly onRetry: () => void;
    };

export interface ConversationNoticeProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly text: string;
}

export interface ConversationComposerProps {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly disabled: boolean;
  readonly sending: boolean;
  readonly maxLength?: number;
  readonly label: string;
  readonly placeholder: string;
  readonly hint: string;
  readonly sendLabel: string;
  readonly sendingLabel: string;
  readonly error: string | null;
  readonly invalid?: boolean;
}

export interface ConversationMessagesProps {
  readonly entries: readonly ConversationEntry[];
  readonly loadState: ConversationLoadState;
  readonly emptyLabel: string;
  readonly logLabel: string;
  readonly statusMessage?: string | null;
  readonly scrollMode?: "flow" | "contained";
}
