import { useId, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CircleCheck,
  CircleCheckBig,
  CircleMinus,
  EyeOff,
  Hourglass,
  Lock,
  Undo2,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { ApplicantWorkspace } from "../../api/workspace";
import { applicationsCopy } from "../../copy";
import { formatDate } from "../../model/format-date";

const copy = applicationsCopy.states;

const WAITING_FACT_ICON: Record<"nothing" | "hidden" | "withdraw", LucideIcon> =
  {
    nothing: CircleCheck,
    hidden: EyeOff,
    withdraw: Undo2,
  };

function StateFrame({
  icon,
  tone,
  headingId,
  children,
}: {
  readonly icon: LucideIcon;
  readonly tone: "neutral" | "success";
  readonly headingId: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-4 rounded-md border p-4 sm:p-7",
        tone === "success"
          ? "border-success/30 bg-success/10"
          : "border-border bg-background-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
          tone === "success"
            ? "bg-success text-background"
            : "bg-background-subtle text-foreground-secondary",
        )}
      >
        <AppIcon icon={icon} size={20} decorative />
      </span>
      <div className="flex min-w-0 flex-1 basis-72 flex-col gap-4">
        {children}
      </div>
    </section>
  );
}

const TITLE_CLASS = "font-display text-title font-semibold text-foreground";
const TEXT_CLASS =
  "mt-1 max-w-prose text-lead text-pretty text-foreground-secondary";

function WaitingState({ canWithdraw }: { readonly canWithdraw: boolean }) {
  const headingId = useId();
  const facts = canWithdraw
    ? [...copy.waiting.facts, copy.waiting.withdrawFact]
    : copy.waiting.facts;
  return (
    <StateFrame icon={Hourglass} tone="neutral" headingId={headingId}>
      <div>
        <h2 id={headingId} className={TITLE_CLASS}>
          {copy.waiting.title}
        </h2>
        <p className={TEXT_CLASS}>{copy.waiting.text}</p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <li
            key={fact.key}
            className="flex items-start gap-2.5 rounded-sm border border-border bg-background px-3.5 py-3 text-body text-foreground-secondary"
          >
            <AppIcon
              icon={WAITING_FACT_ICON[fact.key]}
              size={16}
              className="mt-0.5 text-foreground"
              decorative
            />
            <span>
              <strong className="block font-medium text-foreground">
                {fact.title}
              </strong>
              {fact.text}
            </span>
          </li>
        ))}
      </ul>
    </StateFrame>
  );
}

function AcceptedState() {
  const headingId = useId();
  return (
    <StateFrame icon={CircleCheckBig} tone="success" headingId={headingId}>
      <div>
        <p className="font-display text-meta font-semibold uppercase text-success">
          {copy.accepted.eyebrow}
        </p>
        <h2 id={headingId} className={cn(TITLE_CLASS, "mt-0.5")}>
          {copy.accepted.title}
        </h2>
        <p className={TEXT_CLASS}>{copy.accepted.text}</p>
      </div>
      <p className="flex items-start gap-2 text-body text-foreground-secondary">
        <AppIcon icon={Lock} size={14} className="mt-0.5" decorative />
        {copy.accepted.note}
      </p>
    </StateFrame>
  );
}

function RejectedState({
  reason,
}: {
  readonly reason: ApplicantWorkspace["application"]["publicReason"];
}) {
  const headingId = useId();
  return (
    <StateFrame icon={CircleMinus} tone="neutral" headingId={headingId}>
      <div>
        <h2 id={headingId} className={TITLE_CLASS}>
          {copy.rejected.title}
        </h2>
        <p className={TEXT_CLASS}>{copy.rejected.text}</p>
      </div>
      {reason ? (
        <div className="max-w-xl rounded-sm border border-border bg-background px-3.5 py-3">
          <p className="text-caption text-foreground-tertiary">
            {copy.rejected.reasonLabel}
          </p>
          <p className="mt-0.5 text-lead font-medium text-foreground">
            {copy.rejected.reasons[reason]}
          </p>
        </div>
      ) : null}
      <Link
        href="/listings"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-lead font-medium text-primary hover:underline focus-visible:outline-none focus-visible:shadow-focus"
      >
        {copy.rejected.findMore}
        <AppIcon icon={ArrowRight} size={15} decorative />
      </Link>
    </StateFrame>
  );
}

function WithdrawnState({
  withdrawnAt,
}: {
  readonly withdrawnAt: string | null;
}) {
  const headingId = useId();
  return (
    <StateFrame icon={Undo2} tone="neutral" headingId={headingId}>
      <div>
        <h2 id={headingId} className={TITLE_CLASS}>
          {copy.withdrawn.title}
        </h2>
        <p className={TEXT_CLASS}>
          {withdrawnAt
            ? copy.withdrawn.text(formatDate(withdrawnAt))
            : copy.withdrawn.fallbackText}
        </p>
      </div>
    </StateFrame>
  );
}

export function ApplicationStatePanel({
  workspace,
}: {
  readonly workspace: ApplicantWorkspace;
}) {
  const { application, capabilities } = workspace;
  switch (application.status) {
    case "WAITING":
      return <WaitingState canWithdraw={capabilities.canWithdraw} />;
    case "ACCEPTED":
      return <AcceptedState />;
    case "REJECTED":
      return <RejectedState reason={application.publicReason} />;
    case "WITHDRAWN":
      return <WithdrawnState withdrawnAt={application.withdrawnAt} />;
    case "ACTIVE":
      return null;
  }
}
