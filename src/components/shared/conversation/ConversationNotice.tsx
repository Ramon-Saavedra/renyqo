import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import styles from "./Conversation.module.css";
import type { ConversationNoticeProps } from "./types";

export function ConversationNotice({
  icon,
  title,
  text,
}: ConversationNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex min-w-0 shrink-0 items-start gap-3 border-t border-border px-card-x py-parent-y",
        styles.notice,
      )}
    >
      <AppIcon
        icon={icon}
        size={18}
        className="mt-0.5 text-foreground-secondary"
        decorative
      />
      <div className="min-w-0 wrap-anywhere">
        <p className="text-body font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-body text-foreground-secondary">{text}</p>
      </div>
    </div>
  );
}
