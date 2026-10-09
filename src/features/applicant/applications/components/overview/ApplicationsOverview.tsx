"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button/Button";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { applicationsCopy } from "../../copy";
import { useApplicationsOverview } from "../../hooks/useApplicationsOverview";
import {
  toOverviewCardModel,
  type OverviewCardModel,
} from "../../model/overview-card";
import type { OverviewGroup } from "../../model/status";
import { ApplicationMessage } from "../ApplicationMessage";
import { ApplicationCard } from "./ApplicationCard";
import {
  OverviewFilter,
  type OverviewFilterOption,
  type OverviewFilterValue,
} from "./OverviewFilter";

const copy = applicationsCopy.overview;

const GROUP_ORDER: readonly OverviewGroup[] = ["ACTIVE", "WAITING", "DONE"];

const CONTENT_CLASS = "px-gutter pt-10";
const INNER_CLASS = "mx-auto flex w-full max-w-5xl flex-col gap-6";
const TITLE_CLASS =
  "font-display text-heading-xl font-semibold text-foreground";

function OverviewHeader({ summary }: { readonly summary: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className={TITLE_CLASS}>{copy.title}</h1>
      {summary ? (
        <p className="text-lead text-foreground-secondary">{summary}</p>
      ) : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2.5">
      <span className="sr-only">{copy.loading}</span>
      {[0, 1, 2].map((key) => (
        <RenyqoSkeleton key={key} variant="box" className="h-28 w-full" />
      ))}
    </div>
  );
}

function groupCards(
  cards: readonly OverviewCardModel[],
  filter: OverviewFilterValue,
): readonly {
  readonly group: OverviewGroup;
  readonly cards: readonly OverviewCardModel[];
}[] {
  return GROUP_ORDER.filter((group) => filter === "ALL" || filter === group)
    .map((group) => ({
      group,
      cards: cards.filter((card) => card.status.group === group),
    }))
    .filter((entry) => entry.cards.length > 0);
}

export function ApplicationsOverview() {
  const { state, reload, loadMore } = useApplicationsOverview();
  const [filter, setFilter] = useState<OverviewFilterValue>("ALL");

  if (state.status === "loading") {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <OverviewSkeleton />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <div role="alert">
            <ApplicationMessage
              title={
                state.reason === "contract"
                  ? copy.contractError
                  : copy.loadError
              }
              action={
                <Button variant="outline" onClick={reload}>
                  {copy.retry}
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const cards = state.items.map(toOverviewCardModel);
  const complete = state.nextCursor === null;
  const attention = cards.filter((card) => card.needsAttention).length;
  const summary =
    complete && attention > 0
      ? `${copy.summary(state.totalCount)} · ${copy.attention(attention)}`
      : copy.summary(state.totalCount);

  if (state.totalCount === 0 || cards.length === 0) {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <ApplicationMessage
            title={copy.emptyTitle}
            text={copy.emptyText}
            action={
              <Link href="/listings" className={buttonClass("primary")}>
                {copy.emptyCta}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const options: readonly OverviewFilterOption[] = [
    { value: "ALL", count: state.totalCount },
    ...GROUP_ORDER.map((group) => ({
      value: group,
      count: complete
        ? cards.filter((card) => card.status.group === group).length
        : null,
    })),
  ];
  const groups = groupCards(cards, filter);

  return (
    <div className={CONTENT_CLASS}>
      <div className={INNER_CLASS}>
        <OverviewHeader summary={summary} />
        <OverviewFilter value={filter} options={options} onChange={setFilter} />
        {groups.length === 0 ? (
          <p className="text-body text-foreground-secondary">
            {copy.emptyFilter}
          </p>
        ) : (
          groups.map((entry) => (
            <section
              key={entry.group}
              aria-labelledby={`applications-group-${entry.group}`}
              className="flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2
                  id={`applications-group-${entry.group}`}
                  className="font-display text-meta font-semibold uppercase text-foreground-secondary"
                >
                  {copy.filters[entry.group]}
                </h2>
                <span className="text-caption text-foreground-tertiary">
                  {entry.cards.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {entry.cards.map((card) => (
                  <li key={card.id}>
                    <ApplicationCard card={card} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        {state.nextCursor ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={state.loadingMore}
            >
              {state.loadingMore ? copy.loadingMore : copy.loadMore}
            </Button>
            {state.loadMoreFailed ? (
              <p
                role="alert"
                className="text-caption text-foreground-secondary"
              >
                {copy.loadMoreError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
