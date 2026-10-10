import { cn } from "@/lib/utils/cn";
import styles from "./Conversation.module.css";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationMessages } from "./ConversationMessages";
import { ConversationNotice } from "./ConversationNotice";
import type {
  ConversationComposerProps,
  ConversationMessagesProps,
  ConversationNoticeProps,
} from "./types";

export interface ConversationProps extends ConversationMessagesProps {
  readonly composer?: ConversationComposerProps | null;
  readonly notice?: ConversationNoticeProps | null;
  readonly headerLabel?: string;
  readonly className?: string;
}

export function Conversation({
  composer,
  notice,
  headerLabel,
  className,
  ...messages
}: ConversationProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        styles.surface,
        messages.scrollMode === "contained" && "min-h-0 flex-1",
        className,
      )}
    >
      {headerLabel ? (
        <header
          className={cn(
            "min-w-0 shrink-0 border-b border-border px-card-x py-parent-y",
            styles.header,
          )}
        >
          <h3 className="text-body font-medium wrap-anywhere">{headerLabel}</h3>
        </header>
      ) : null}
      <ConversationMessages {...messages} />
      {notice ? <ConversationNotice {...notice} /> : null}
      {composer ? <ConversationComposer {...composer} /> : null}
    </div>
  );
}
