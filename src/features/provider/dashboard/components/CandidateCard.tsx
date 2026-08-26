import type { Candidate } from "../types";
import { CANDIDATE_SLOT_CLASS } from "./candidate-slot-layout";

const CARD_CLASS = `${CANDIDATE_SLOT_CLASS} border border-border bg-background`;
const AVATAR_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success-surface-border bg-success-surface/15 font-display text-caption font-semibold text-success-vivid";
const COPY_CLASS = "flex h-9 min-w-0 flex-1 flex-col justify-center gap-0.5";
const NAME_CLASS = "truncate text-caption font-medium text-foreground";
const META_CLASS = "truncate text-caption text-foreground-secondary";

export function CandidateCard({
  candidate,
}: {
  readonly candidate: Candidate;
}) {
  return (
    <article className={CARD_CLASS}>
      <span aria-hidden="true" className={AVATAR_CLASS}>
        {candidate.initials}
      </span>
      <span className={COPY_CLASS}>
        <span className={NAME_CLASS}>{candidate.name}</span>
        <span className={META_CLASS}>{candidate.household}</span>
      </span>
    </article>
  );
}
