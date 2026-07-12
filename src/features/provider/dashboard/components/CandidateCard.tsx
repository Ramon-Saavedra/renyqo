import { Check, MessageSquare, User } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { CANDIDATE_BADGE_META, dashboardCopy } from "../copy/dashboard";
import type { Candidate } from "../types";

interface CandidateCardProps {
  candidate: Candidate;
}

const CARD_CLASS =
  "flex min-w-0 flex-col rounded-md border border-border bg-background-subtle px-2 py-4 hover:border-foreground-tertiary";
const TOP_CLASS = "mb-3.5 flex items-center justify-between gap-4";
const AVATAR_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-caption font-semibold text-primary";
const NAME_CLASS = "flex min-w-0 flex-col text-right leading-tight";
const NAME_STRONG_CLASS = "truncate text-caption font-medium text-foreground";
const NAME_SUB_CLASS = "truncate text-caption text-foreground-tertiary";
const BADGE_CLASS =
  "mb-3.5 block w-full rounded-sm px-2 py-1.5 text-center font-mono text-meta uppercase";

const ATTRS_CLASS =
  "mb-3.5 grid gap-2 border-t border-border pt-3 text-caption";
const ATTR_ROW_CLASS = "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2";
const ATTR_KEY_CLASS = "min-w-0 truncate text-foreground-tertiary";
const ATTR_VALUE_CLASS =
  "inline-flex min-w-0 max-w-24 items-center justify-end gap-1.5 text-right font-medium";
const ATTR_VALUE_TEXT_CLASS = "min-w-0 truncate";

const ACTIONS_CLASS = "mt-auto flex gap-1";
const PROFILE_BTN_CLASS =
  "inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-sm border border-border-strong bg-transparent px-2.5 py-1.5 text-caption font-medium text-foreground-secondary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
const CHAT_BTN_CLASS =
  "inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-2 text-caption font-medium text-primary-foreground hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

const VALUE_STATE_CLASS = {
  ok: "text-foreground",
  open: "text-warning",
  muted: "font-normal text-foreground-tertiary",
} as const;

export function CandidateCard({ candidate }: CandidateCardProps) {
  const { candidates } = dashboardCopy;
  const badge = CANDIDATE_BADGE_META[candidate.badge];

  return (
    <article className={CARD_CLASS}>
      <header className={TOP_CLASS}>
        <span aria-hidden="true" className={AVATAR_CLASS}>
          {candidate.initials}
        </span>
        <span className={NAME_CLASS}>
          <span className={NAME_STRONG_CLASS}>{candidate.name}</span>
          <span className={NAME_SUB_CLASS}>{candidate.household}</span>
        </span>
      </header>

      <ul className={ATTRS_CLASS}>
        {candidate.attrs.map((attr) => (
          <li key={attr.label} className={ATTR_ROW_CLASS}>
            <span className={ATTR_KEY_CLASS}>{attr.label}</span>
            <span
              className={cn(ATTR_VALUE_CLASS, VALUE_STATE_CLASS[attr.state])}
            >
              {attr.state === "ok" && (
                <AppIcon
                  icon={Check}
                  size={11}
                  strokeWidth={2.2}
                  decorative
                  className="text-primary"
                />
              )}
              <span className={ATTR_VALUE_TEXT_CLASS}>{attr.value}</span>
            </span>
          </li>
        ))}
      </ul>
      <span className={cn(BADGE_CLASS, badge.className)}>{badge.label}</span>

      <div className={ACTIONS_CLASS}>
        <button
          type="button"
          className={PROFILE_BTN_CLASS}
          aria-label={candidates.profile}
        >
          <AppIcon icon={User} size={11} strokeWidth={1.8} decorative />
        </button>
        <button
          type="button"
          className={CHAT_BTN_CLASS}
          aria-label={candidates.chat}
        >
          <AppIcon
            icon={MessageSquare}
            size={11}
            strokeWidth={1.8}
            decorative
          />
        </button>
      </div>
    </article>
  );
}
